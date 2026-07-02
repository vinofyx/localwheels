const Anthropic      = require('@anthropic-ai/sdk');
const FleetVehicle   = require('../models/FleetVehicle');
const VehicleHealth  = require('../models/VehicleHealth');
const { haversine }  = require('./trafficEngine');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Vehicle scoring for allocation ──────────────────────────────────────────

function scoreVehicleForAllocation(vehicle, requirements) {
  const {
    weight_tons = 1,
    volume_cbm  = 0,
    origin_lat,
    origin_lng,
    vehicle_type,
    priority    = 'normal',
  } = requirements;

  let score = 100;

  // Hard disqualify
  if (!['available','idle'].includes(vehicle.status)) return -1;
  if (!vehicle.is_active) return -1;
  if (vehicle.health_score < 30) return -1;

  // Capacity — must fit load
  if (vehicle.capacity_tons < weight_tons) return -1;
  const capUtil = weight_tons / vehicle.capacity_tons;
  // Prefer 60-85% utilization sweet spot
  if (capUtil >= 0.6 && capUtil <= 0.85) score += 15;
  else if (capUtil > 0.85) score -= 5;
  else if (capUtil < 0.3)  score -= 10; // wasteful

  // Volume check (if applicable)
  if (volume_cbm > 0 && vehicle.capacity_cbm > 0 && vehicle.capacity_cbm < volume_cbm) return -1;

  // Vehicle type preference
  if (vehicle_type && vehicle.vehicle_type === vehicle_type) score += 20;

  // Health score (strong signal)
  score += (vehicle.health_score - 50) * 0.3; // -15 to +15

  // Age penalty
  if (vehicle.year) {
    const age = new Date().getFullYear() - vehicle.year;
    if (age > 10) score -= 15;
    else if (age > 7) score -= 8;
    else if (age > 5) score -= 3;
  }

  // Compliance penalties
  const now = new Date();
  const expiries = [vehicle.insurance_expiry, vehicle.fitness_expiry, vehicle.permit_expiry, vehicle.pollution_expiry];
  for (const exp of expiries) {
    if (!exp) { score -= 5; continue; }
    const days = (new Date(exp) - now) / 86400000;
    if (days < 0)  { score -= 30; }
    else if (days < 7)  score -= 15;
    else if (days < 30) score -= 5;
  }

  // Fuel level — prefer well-fuelled vehicles
  if (vehicle.fuel_level_pct < 20) score -= 20;
  else if (vehicle.fuel_level_pct > 60) score += 5;

  // Proximity bonus
  if (origin_lat && origin_lng && vehicle.current_lat && vehicle.current_lng) {
    const km = haversine(origin_lat, origin_lng, vehicle.current_lat, vehicle.current_lng);
    if (km < 5)   score += 25;
    else if (km < 15)  score += 15;
    else if (km < 50)  score += 8;
    else if (km < 150) score += 2;
    else score -= 5;
  }

  // Emergency priority — prefer largest healthy vehicle
  if (priority === 'emergency') {
    score += vehicle.health_score * 0.1;
    score += vehicle.capacity_tons * 2;
  }

  // Idle vehicle slight preference (get them moving)
  if (vehicle.status === 'idle') score += 3;

  return Math.round(score);
}

// ─── Find best vehicles ───────────────────────────────────────────────────────

async function findBestVehicles(companyId, requirements) {
  const vehicles = await FleetVehicle.find({
    company_id: companyId,
    is_active:  true,
    status:     { $in: ['available','idle'] },
  }).populate('current_driver_id', 'name phone status').lean();

  const scored = vehicles
    .map(v => ({ vehicle: v, score: scoreVehicleForAllocation(v, requirements) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored.map(x => ({
    ...x.vehicle,
    allocation_score: x.score,
    allocation_reason: buildReason(x.vehicle, requirements, x.score),
  }));
}

function buildReason(v, req, score) {
  const parts = [];
  if (['available','idle'].includes(v.status)) parts.push('currently available');
  if (v.health_score >= 80) parts.push(`health ${v.health_score}/100`);
  if (v.fuel_level_pct >= 60) parts.push(`${v.fuel_level_pct}% fuel`);
  if (req.origin_lat && v.current_lat) {
    const km = haversine(req.origin_lat, req.origin_lng, v.current_lat, v.current_lng);
    parts.push(`${km.toFixed(0)} km away`);
  }
  return parts.join(' · ') || 'Best available match';
}

// ─── AI Fleet Recommendation via Claude ──────────────────────────────────────

async function getAIFleetRecommendation({ vehicles, requirements, fleetStats }) {
  if (!vehicles.length) {
    return {
      recommendation: 'No vehicles available matching the requirements.',
      reasoning: 'All vehicles are either on trip, in maintenance, or do not have sufficient capacity.',
      best_vehicle_id: null,
      risks: [],
      idle_detection: [],
      utilization_insight: 'Fleet is fully utilized.',
    };
  }

  const systemPrompt = `You are an AI Fleet Manager for an Indian logistics company.
Analyze the fleet data and respond with JSON only (no markdown):
{
  "recommendation": "one clear recommendation sentence",
  "reasoning": "2-3 sentence explanation",
  "best_vehicle_index": 0,
  "risks": ["risk1", "risk2"],
  "idle_detection": ["vehicle number of idle/underutilized vehicles"],
  "utilization_insight": "fleet utilization observation",
  "replacement_flags": ["vehicle numbers that should be considered for replacement"]
}`;

  const userMsg = `
Fleet Overview:
- Total vehicles: ${fleetStats.total}
- Available: ${fleetStats.available}
- On Trip: ${fleetStats.on_trip}
- Maintenance: ${fleetStats.maintenance}
- Avg Health: ${fleetStats.avg_health?.toFixed(0)}/100

Load Requirements:
- Weight: ${requirements.weight_tons} tons
- Priority: ${requirements.priority || 'normal'}
- Origin: ${requirements.origin_address || 'depot'}

Top ${vehicles.length} Vehicle Candidates:
${vehicles.map((v, i) => `${i + 1}. ${v.vehicle_number} (${v.vehicle_type})
   Health:${v.health_score} Fuel:${v.fuel_level_pct}% Cap:${v.capacity_tons}T
   Status:${v.status} Score:${v.allocation_score}`).join('\n')}
`;

  try {
    const resp = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMsg }],
    });
    return JSON.parse(resp.content[0]?.text?.trim() || '{}');
  } catch {
    return {
      recommendation:      `Assign ${vehicles[0]?.vehicle_number} — highest allocation score.`,
      reasoning:           'Rule-based selection: best health, capacity, and availability match.',
      best_vehicle_index:  0,
      risks:               [],
      idle_detection:      [],
      utilization_insight: `Fleet utilization: ${((fleetStats.on_trip / Math.max(fleetStats.total, 1)) * 100).toFixed(0)}%`,
      replacement_flags:   [],
    };
  }
}

// ─── AI Predictive Maintenance via Claude ────────────────────────────────────

async function getAIPredictiveMaintenance(vehicle, maintenanceHistory, fuelHistory) {
  const systemPrompt = `You are a predictive maintenance AI for logistics fleet vehicles.
Return JSON only:
{
  "predicted_issues": [
    { "component": "...", "issue": "...", "probability": 0.0-1.0, "urgency": "low|medium|high|critical", "estimated_days": 0 }
  ],
  "maintenance_schedule": [
    { "type": "...", "recommended_date": "YYYY-MM-DD", "priority": "low|normal|high|urgent" }
  ],
  "health_insight": "brief vehicle health summary",
  "replacement_recommendation": true|false,
  "replacement_reason": "..."
}`;

  const age = vehicle.year ? new Date().getFullYear() - vehicle.year : 0;
  const avgMileage = fuelHistory.length
    ? (fuelHistory.reduce((s, f) => s + (f.mileage_kmpl || 0), 0) / fuelHistory.length).toFixed(1)
    : 'unknown';

  const userMsg = `
Vehicle: ${vehicle.vehicle_number} (${vehicle.vehicle_type})
Age: ${age} years | Odometer: ${vehicle.odometer_km} km | Engine Hours: ${vehicle.engine_hours}h
Health Score: ${vehicle.health_score}/100
Breakdown History: ${vehicle.breakdown_count} incidents
Average Mileage: ${avgMileage} km/L

Recent Maintenance (last 5):
${maintenanceHistory.slice(0, 5).map(m => `- ${m.maintenance_type}: ${m.status} on ${m.completed_date?.toDateString() || m.scheduled_date?.toDateString() || 'N/A'}`).join('\n') || 'No records'}

Fuel Trends:
${fuelHistory.slice(0, 3).map(f => `- ${f.liters_filled}L filled, ${f.mileage_kmpl} km/L`).join('\n') || 'No fuel records'}
`;

  try {
    const resp = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMsg }],
    });
    return JSON.parse(resp.content[0]?.text?.trim() || '{}');
  } catch {
    const issues = [];
    if (vehicle.health_score < 60) issues.push({ component: 'General', issue: 'Comprehensive service overdue', probability: 0.9, urgency: 'high', estimated_days: 7 });
    if (age > 8) issues.push({ component: 'Engine', issue: 'Engine wear expected at this age', probability: 0.6, urgency: 'medium', estimated_days: 30 });
    return {
      predicted_issues: issues,
      maintenance_schedule: [],
      health_insight: `Vehicle is ${age} years old with ${vehicle.odometer_km} km. Health score: ${vehicle.health_score}/100.`,
      replacement_recommendation: age > 10 && vehicle.health_score < 50,
      replacement_reason: age > 10 && vehicle.health_score < 50 ? 'Vehicle age and health score suggest replacement' : '',
    };
  }
}

module.exports = { findBestVehicles, getAIFleetRecommendation, getAIPredictiveMaintenance, scoreVehicleForAllocation };
