const Anthropic    = require('@anthropic-ai/sdk');
const Shipment     = require('../models/Shipment');
const FleetVehicle = require('../models/FleetVehicle');
const Driver       = require('../models/Driver');
const { haversine } = require('./trafficEngine');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Plan number generator ────────────────────────────────────────────────────
function genPlanNumber(prefix = 'DP') {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${ymd}-${rnd}`;
}

// ─── SLA hours by priority ────────────────────────────────────────────────────
const SLA_HOURS = { emergency: 4, high: 12, normal: 48, low: 96 };

// ─── Group shipments that can share a vehicle (same direction/city cluster) ──
function groupShipments(shipments, maxWeightKg, maxPkgs = 500) {
  // Sort by priority then destination
  const sorted = [...shipments].sort((a, b) => {
    const pOrder = { emergency: 0, high: 1, normal: 2, low: 3 };
    return (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2);
  });

  const groups = [];
  const used   = new Set();

  for (const s of sorted) {
    if (used.has(String(s._id))) continue;

    const group = [s];
    used.add(String(s._id));
    let groupWeight = Number(s.weight || 0);
    let groupPkgs   = Number(s.packages || 1);

    // Emergency shipments never grouped (dedicated vehicle)
    if ((s.priority || 'normal') === 'emergency') {
      groups.push(group);
      continue;
    }

    for (const t of sorted) {
      if (used.has(String(t._id))) continue;
      if ((t.priority || 'normal') === 'emergency') continue;

      const addWeight = Number(t.weight || 0);
      const addPkgs   = Number(t.packages || 1);

      // Same city/region destination
      const destMatch = s.destination && t.destination &&
        s.destination.split(',')[0].trim().toLowerCase() === t.destination.split(',')[0].trim().toLowerCase();

      if (destMatch && (groupWeight + addWeight) <= maxWeightKg && (groupPkgs + addPkgs) <= maxPkgs) {
        group.push(t);
        used.add(String(t._id));
        groupWeight += addWeight;
        groupPkgs   += addPkgs;
      }
    }

    groups.push(group);
  }

  return groups;
}

// ─── Score a vehicle for a shipment group ────────────────────────────────────
function scoreVehicleForDispatch(vehicle, requirements) {
  const { total_weight_kg = 0, origin_lat, origin_lng, priority = 'normal' } = requirements;

  if (!['available','idle'].includes(vehicle.status)) return -1;
  if (!vehicle.is_active) return -1;

  const capKg = (vehicle.capacity_tons || 5) * 1000;
  if (total_weight_kg > capKg) return -1;
  if (vehicle.health_score < 40) return -1;

  let score = 100;
  const utilPct = total_weight_kg / capKg;
  if (utilPct >= 0.6 && utilPct <= 0.85) score += 15;

  score += (vehicle.health_score - 50) * 0.25;

  if (vehicle.fuel_level_pct < 20)   score -= 25;
  else if (vehicle.fuel_level_pct > 60) score += 5;

  // Proximity bonus
  if (origin_lat && origin_lng && vehicle.current_lat && vehicle.current_lng) {
    const km = haversine(origin_lat, origin_lng, vehicle.current_lat, vehicle.current_lng);
    score += km < 10 ? 20 : km < 30 ? 12 : km < 100 ? 5 : 0;
  }

  if (priority === 'emergency') score += vehicle.health_score * 0.1;

  // Compliance check
  const now = new Date();
  const exps = [vehicle.insurance_expiry, vehicle.fitness_expiry, vehicle.permit_expiry];
  for (const e of exps) {
    if (!e) { score -= 5; continue; }
    const days = (new Date(e) - now) / 86400000;
    if (days < 0) score -= 40;
    else if (days < 7) score -= 15;
  }

  return Math.round(score);
}

function scoreDriverForDispatch(driver, requirements) {
  const { origin_lat, origin_lng, priority = 'normal' } = requirements;

  if (driver.status !== 'available') return -1;
  if (!driver.is_active) return -1;

  let score = 100;

  if (driver.license_expiry) {
    const days = (new Date(driver.license_expiry) - new Date()) / 86400000;
    if (days < 0) return -1;
    if (days < 30) score -= 20;
  }

  if (driver.rating) score += driver.rating * 3;

  if (origin_lat && origin_lng && driver.current_lat && driver.current_lng) {
    const km = haversine(origin_lat, origin_lng, driver.current_lat, driver.current_lng);
    score += km < 10 ? 20 : km < 30 ? 10 : km < 100 ? 5 : 0;
  }

  return Math.round(score);
}

// ─── Find best vehicle + driver for a shipment group ─────────────────────────
async function findBestAssignment(companyId, shipmentGroup, originLat, originLng) {
  const totalWeight = shipmentGroup.reduce((s, sh) => s + Number(sh.weight || 0), 0);
  const priority    = shipmentGroup[0]?.priority || 'normal';
  const req         = { total_weight_kg: totalWeight, origin_lat: originLat, origin_lng: originLng, priority };

  const [vehicles, drivers] = await Promise.all([
    FleetVehicle.find({ company_id: companyId, is_active: true, status: { $in: ['available','idle'] } }).lean(),
    Driver.find({ company_id: companyId, is_active: true, status: 'available' }).lean(),
  ]);

  const bestVehicle = vehicles
    .map(v => ({ v, s: scoreVehicleForDispatch(v, req) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)[0]?.v || null;

  const bestDriver = drivers
    .map(d => ({ d, s: scoreDriverForDispatch(d, req) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)[0]?.d || null;

  const capKg = (bestVehicle?.capacity_tons || 5) * 1000;
  const utilPct = capKg > 0 ? Math.round((totalWeight / capKg) * 100) : 0;

  return { bestVehicle, bestDriver, totalWeight, utilPct, priority };
}

// ─── AI dispatch planning via Claude ─────────────────────────────────────────
async function getAIDispatchPlan({ shipmentGroups, companyId, originAddress, queueStats }) {
  const system = `You are an AI Dispatch Planner for an Indian logistics company.
For each shipment group, provide a JSON dispatch plan array. Return ONLY valid JSON — no markdown, no prose.
Each element: {
  "group_index": 0,
  "load_type": "ftl|ltl|partial",
  "confidence": 0-100,
  "reasoning": "brief explanation",
  "grouping_reason": "why these are grouped",
  "risks": ["risk1"],
  "dispatch_priority": "immediate|today|scheduled",
  "estimated_loading_min": 30
}`;

  const userMsg = `
Origin: ${originAddress || 'Main Depot'}
Queue: ${queueStats.total} shipments pending (${queueStats.emergency} emergency, ${queueStats.high} high priority)

Shipment Groups (${shipmentGroups.length}):
${shipmentGroups.map((g, i) => `
Group ${i}: ${g.shipments.length} shipment(s)
  Weight: ${g.totalWeight} kg | Vehicle: ${g.bestVehicle?.vehicle_number || 'TBD'} (${g.bestVehicle?.vehicle_type})
  Driver: ${g.bestDriver?.name || 'TBD'}
  Destinations: ${[...new Set(g.shipments.map(s => s.destination))].join(', ')}
  Priority: ${g.priority}
  Vehicle Utilization: ${g.utilPct}%`).join('\n')}
`;

  try {
    const resp = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system,
      messages:   [{ role: 'user', content: userMsg }],
    });
    const parsed = JSON.parse(resp.content[0]?.text?.trim() || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return shipmentGroups.map((_, i) => ({
      group_index:          i,
      load_type:            'ftl',
      confidence:           70,
      reasoning:            'Rule-based plan: nearest driver + best health vehicle assigned.',
      grouping_reason:      'Same destination cluster',
      risks:                [],
      dispatch_priority:    'today',
      estimated_loading_min: 30,
    }));
  }
}

// ─── AI exception resolution ──────────────────────────────────────────────────
async function getExceptionResolution({ exceptionType, trip, companyId }) {
  const system = `You are a logistics exception management AI. Return JSON only:
{
  "recommendation": "one sentence action to take",
  "ai_actions": ["action1", "action2"],
  "severity_assessment": "low|medium|high|critical",
  "notify_customer": true|false,
  "escalate": true|false
}`;

  const userMsg = `
Exception: ${exceptionType}
Trip: ${trip?.trip_number} | Vehicle: ${trip?.vehicle_number} | Driver: ${trip?.driver_name}
Shipments: ${trip?.lr_numbers?.join(', ')}
`;

  try {
    const resp = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system,
      messages:   [{ role: 'user', content: userMsg }],
    });
    return JSON.parse(resp.content[0]?.text?.trim() || '{}');
  } catch {
    const actionsMap = {
      vehicle_breakdown: ['Find alternate vehicle immediately', 'Notify customer of delay', 'Contact roadside assistance'],
      driver_absent:     ['Assign alternate driver', 'Verify driver availability', 'Notify supervisor'],
      weather_alert:     ['Hold dispatch until conditions improve', 'Notify all affected customers'],
      road_closure:      ['Recalculate route via alternate road', 'Estimate new ETA'],
    };
    return {
      recommendation:      `Handle ${exceptionType} immediately`,
      ai_actions:          actionsMap[exceptionType] || ['Assess situation', 'Notify supervisor'],
      severity_assessment: 'high',
      notify_customer:     true,
      escalate:            exceptionType === 'vehicle_breakdown' || exceptionType === 'accident',
    };
  }
}

// ─── Main: build full dispatch plans for pending queue items ─────────────────
async function buildDispatchPlans({ companyId, queueItems, originLat, originLng, originAddress }) {
  // Load full shipment data
  const shipmentIds = queueItems.map(q => q.shipment_id);
  const shipments   = await Shipment.find({ _id: { $in: shipmentIds }, company_id: companyId }).lean();
  const shipMap     = shipments.reduce((acc, s) => { acc[String(s._id)] = s; return acc; }, {});

  // Attach queue meta to shipments
  const enriched = queueItems.map(q => {
    const s = shipMap[String(q.shipment_id)];
    if (!s) return null;
    return { ...s, priority: q.priority || s.priority || 'normal', queue_id: q._id };
  }).filter(Boolean);

  // Estimate vehicle capacity (use average for unknown scenarios)
  const avgVehicleCapKg = 5000;
  const groups = groupShipments(enriched, avgVehicleCapKg);

  // Find best assignment per group
  const assignedGroups = await Promise.all(
    groups.map(async (group) => {
      const assignment = await findBestAssignment(companyId, group, originLat, originLng);
      return { shipments: group, ...assignment };
    })
  );

  // Queue stats for AI context
  const queueStats = {
    total:     queueItems.length,
    emergency: queueItems.filter(q => q.priority === 'emergency').length,
    high:      queueItems.filter(q => q.priority === 'high').length,
  };

  // AI plans
  const aiPlans = await getAIDispatchPlan({ shipmentGroups: assignedGroups, companyId, originAddress, queueStats });

  // Merge AI output with assignments
  return assignedGroups.map((g, i) => {
    const ai = aiPlans[i] || {};
    const totalWeight  = g.totalWeight;
    const totalPkgs    = g.shipments.reduce((s, sh) => s + Number(sh.packages || 1), 0);
    const slaHours     = SLA_HOURS[g.priority] || 48;
    const dispatchTime = new Date(Date.now() + (ai.estimated_loading_min || 30) * 60000);
    const arrivalTime  = new Date(dispatchTime.getTime() + 240 * 60000); // 4h default

    return {
      shipments:            g.shipments,
      queue_ids:            g.shipments.map(s => s.queue_id),
      best_vehicle:         g.bestVehicle,
      best_driver:          g.bestDriver,
      total_weight_kg:      totalWeight,
      total_packages:       totalPkgs,
      load_type:            ai.load_type || 'ftl',
      utilization_pct:      g.utilPct,
      priority:             g.priority,
      ai_confidence:        ai.confidence || 70,
      ai_reasoning:         ai.reasoning || '',
      ai_grouping_reason:   ai.grouping_reason || '',
      ai_risks:             ai.risks || [],
      dispatch_priority:    ai.dispatch_priority || 'today',
      estimated_loading_min:ai.estimated_loading_min || 30,
      planned_dispatch_time: dispatchTime,
      estimated_arrival:    arrivalTime,
      sla_deadline:         new Date(Date.now() + slaHours * 3600000),
      sla_hours:            slaHours,
    };
  });
}

module.exports = { buildDispatchPlans, getExceptionResolution, genPlanNumber, SLA_HOURS, groupShipments };
