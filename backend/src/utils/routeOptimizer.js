const Anthropic = require('@anthropic-ai/sdk');
const Vehicle   = require('../models/Vehicle');
const Driver    = require('../models/Driver');
const Shipment  = require('../models/Shipment');
const { getWeather, getWeatherImpact }   = require('./weatherEngine');
const { getTraffic, getTrafficImpact, haversine } = require('./trafficEngine');
const { calculateFuel, computeFuelSaving, computeOptimizationScore } = require('./fuelOptimizer');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Vehicle Scoring ─────────────────────────────────────────────────────────

function scoreVehicle(vehicle, requirements) {
  let score = 100;

  // Status
  if (vehicle.status !== 'available') score -= 80;

  // Capacity check
  const needed = requirements.total_weight_tons || 1;
  const cap    = vehicle.capacity_tons || 5;
  if (needed > cap) return -1; // disqualify
  const utilization = needed / cap;
  if (utilization >= 0.5 && utilization <= 0.85) score += 15; // sweet spot

  // Expiry penalties
  const now = new Date();
  const checkExpiry = (date, label) => {
    if (!date) return;
    const daysLeft = (new Date(date) - now) / (1000 * 60 * 60 * 24);
    if (daysLeft < 0)   score -= 50; // expired
    else if (daysLeft < 30) score -= 20;
    else if (daysLeft < 90) score -= 5;
  };
  checkExpiry(vehicle.insurance_expiry, 'insurance');
  checkExpiry(vehicle.fitness_expiry,   'fitness');
  checkExpiry(vehicle.permit_expiry,    'permit');

  // Proximity bonus (if GPS available)
  if (requirements.origin_lat && requirements.origin_lng && vehicle.current_lat && vehicle.current_lng) {
    const dist = haversine(requirements.origin_lat, requirements.origin_lng, vehicle.current_lat, vehicle.current_lng);
    if (dist < 10)       score += 20;
    else if (dist < 30)  score += 10;
    else if (dist < 100) score += 5;
  }

  return score;
}

function scoreDriver(driver, requirements) {
  let score = 100;

  if (driver.status !== 'available') score -= 80;

  // License expiry
  if (driver.license_expiry) {
    const daysLeft = (new Date(driver.license_expiry) - new Date()) / (1000 * 60 * 60 * 24);
    if (daysLeft < 0)   score -= 50;
    else if (daysLeft < 30) score -= 20;
    else if (daysLeft < 90) score -= 5;
  }

  // Rating bonus
  if (driver.rating) score += driver.rating * 2;

  // Proximity bonus
  if (requirements.origin_lat && requirements.origin_lng && driver.current_lat && driver.current_lng) {
    const dist = haversine(requirements.origin_lat, requirements.origin_lng, driver.current_lat, driver.current_lng);
    if (dist < 10)       score += 20;
    else if (dist < 30)  score += 10;
    else if (dist < 100) score += 5;
  }

  return score;
}

// ─── Best Vehicle / Driver Selection ─────────────────────────────────────────

async function selectBestVehicle(companyId, requirements) {
  const vehicles = await Vehicle.find({
    company_id: companyId,
    is_active:  true,
    status:     'available',
  }).lean();

  const scored = vehicles
    .map(v => ({ vehicle: v, score: scoreVehicle(v, requirements) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map(x => ({
    vehicle_id:          x.vehicle._id,
    registration_number: x.vehicle.registration_number,
    vehicle_type:        x.vehicle.vehicle_type,
    capacity_tons:       x.vehicle.capacity_tons,
    score:               x.score,
    reason:              buildVehicleReason(x.vehicle, requirements),
  }));
}

async function selectBestDriver(companyId, requirements) {
  const drivers = await Driver.find({
    company_id: companyId,
    is_active:  true,
    status:     'available',
  }).lean();

  const scored = drivers
    .map(d => ({ driver: d, score: scoreDriver(d, requirements) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map(x => ({
    driver_id:   x.driver._id,
    name:        x.driver.name,
    phone:       x.driver.phone,
    license:     x.driver.license_number,
    score:       x.score,
    reason:      buildDriverReason(x.driver, requirements),
  }));
}

function buildVehicleReason(v, req) {
  const parts = [`${v.vehicle_type} with ${v.capacity_tons}T capacity`];
  if (v.status === 'available') parts.push('currently available');
  return parts.join(', ');
}

function buildDriverReason(d, req) {
  const parts = [`License: ${d.license_number}`];
  if (d.status === 'available') parts.push('available now');
  if (d.rating) parts.push(`rated ${d.rating}/5`);
  return parts.join(', ');
}

// ─── Stop Ordering (Nearest Neighbor TSP heuristic) ──────────────────────────

function orderStops(originLat, originLng, stops) {
  if (stops.length <= 1) return stops;

  const unvisited = [...stops];
  const ordered   = [];
  let curLat = originLat, curLng = originLng;

  // Emergency stops always first
  const emergency = unvisited.filter(s => s.priority === 'emergency');
  const rest      = unvisited.filter(s => s.priority !== 'emergency');

  for (const e of emergency) {
    ordered.push({ ...e, sequence: ordered.length + 1 });
  }

  // Nearest neighbour for the rest
  const remaining = [...rest];
  while (remaining.length) {
    let bestIdx = 0, bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const s = remaining[i];
      if (!s.lat || !s.lng) { bestIdx = i; break; }
      const d = haversine(curLat, curLng, s.lat, s.lng);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    curLat = next.lat || curLat;
    curLng = next.lng || curLng;
    ordered.push({ ...next, sequence: ordered.length + 1 });
  }

  return ordered;
}

// ─── ETA per Stop ─────────────────────────────────────────────────────────────

function assignETAs(stops, originLat, originLng, baseSpeedKmh = 45, delayMinTotal = 0) {
  let prevLat = originLat, prevLng = originLng;
  let elapsed = 0;
  const now   = new Date();

  return stops.map(stop => {
    const dist  = (stop.lat && stop.lng) ? haversine(prevLat, prevLng, stop.lat, stop.lng) : 50;
    const tMin  = (dist / baseSpeedKmh) * 60;
    const stopDelay = delayMinTotal / stops.length;
    elapsed    += tMin + stopDelay + 15; // 15 min service time per stop
    prevLat     = stop.lat || prevLat;
    prevLng     = stop.lng || prevLng;
    const eta   = new Date(now.getTime() + elapsed * 60000);
    return { ...stop, estimated_arrival: eta };
  });
}

// ─── AI Optimization via Claude ──────────────────────────────────────────────

async function getAIRecommendation({
  shipments, vehicleCandidates, driverCandidates,
  weatherImpact, trafficImpact, fuelMetrics,
  optimizationType, totalDistanceKm,
}) {
  const systemPrompt = `You are an expert logistics route optimization AI for Indian freight operations.
Analyze the given data and provide a JSON response with:
- recommendation: best strategy (1-2 sentences)
- reasoning: why this is optimal (2-3 sentences)
- risks: array of risk strings (max 3)
- delay_risk: "low" | "medium" | "high"
- delay_risk_reason: brief explanation
- optimization_score_adjustment: integer -10 to +10
Respond with ONLY valid JSON, no markdown.`;

  const userMsg = `
Route Optimization Request:
- Optimization Type: ${optimizationType}
- Total Distance: ${totalDistanceKm.toFixed(1)} km
- Shipments: ${shipments.length} (${shipments.map(s => `LR:${s.lr_number} ${s.destination} ${s.weight || 0}kg`).join(', ')})
- Weather: ${weatherImpact.weather_summary} | Risk: ${weatherImpact.driving_risk}
- Traffic: ${trafficImpact.traffic_summary}
- Fuel Cost Estimated: ₹${fuelMetrics.fuel_cost?.toFixed(0)}
- CO₂: ${fuelMetrics.co2_emission_kg?.toFixed(1)} kg
- Top Vehicle: ${vehicleCandidates[0] ? `${vehicleCandidates[0].registration_number} (${vehicleCandidates[0].vehicle_type}, ${vehicleCandidates[0].capacity_tons}T)` : 'None'}
- Top Driver: ${driverCandidates[0] ? `${driverCandidates[0].name}` : 'None'}
- Weather Alerts: ${weatherImpact.weather_alerts.join(', ') || 'None'}
- Traffic Alerts: ${trafficImpact.traffic_alerts.join(', ') || 'None'}
`;

  try {
    const response = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages:   [{ role: 'user', content: userMsg }],
      system:     systemPrompt,
    });

    const text = response.content[0]?.text || '{}';
    return JSON.parse(text.trim());
  } catch (err) {
    return {
      recommendation:           'Proceed with nearest available vehicle and driver on the calculated route.',
      reasoning:                'AI analysis unavailable. Falling back to rule-based optimization.',
      risks:                    [],
      delay_risk:               weatherImpact.driving_risk === 'high' ? 'high' : 'low',
      delay_risk_reason:        weatherImpact.driving_risk !== 'low' ? weatherImpact.weather_summary : 'Normal conditions',
      optimization_score_adjustment: 0,
    };
  }
}

// ─── Main Optimization Function ───────────────────────────────────────────────

async function optimizeRoute({
  companyId,
  shipmentIds,
  originLat,
  originLng,
  originAddress,
  optimizationType = 'ai_recommended',
  routeType        = 'single_stop',
  dieselPrice,
  preferredVehicleId,
  preferredDriverId,
}) {
  // Load shipments
  const shipments = await Shipment.find({
    _id:        { $in: shipmentIds },
    company_id: companyId,
  }).lean();

  if (!shipments.length) throw new Error('No valid shipments found');

  // Build stops from shipments
  let stops = shipments.map((s, i) => ({
    sequence:     i + 1,
    shipment_id:  s._id,
    lr_number:    s.lr_number,
    address:      s.receiver_address || s.destination,
    lat:          s.receiver_lat,
    lng:          s.receiver_lng,
    stop_type:    'delivery',
    priority:     s.priority || 'normal',
    time_window_start: s.delivery_window_start,
    time_window_end:   s.delivery_window_end,
    status:       'pending',
  }));

  // Pick primary destination for weather/traffic (first stop or centroid)
  const destLat = stops[0]?.lat || (originLat + 1);
  const destLng = stops[0]?.lng || (originLng + 1);

  const totalWeight = shipments.reduce((sum, s) => sum + (s.weight || 0) / 1000, 0); // kg → tons

  // Parallel: weather + traffic + vehicle/driver candidates
  const [weather, traffic, vehicleCandidates, driverCandidates] = await Promise.all([
    getWeather(originLat, originLng, companyId).catch(() => null),
    getTraffic(originLat, originLng, destLat, destLng, companyId).catch(() => null),
    preferredVehicleId
      ? Vehicle.find({ _id: preferredVehicleId, company_id: companyId }).lean().then(r => r.map(v => ({
          vehicle_id: v._id, registration_number: v.registration_number,
          vehicle_type: v.vehicle_type, capacity_tons: v.capacity_tons, score: 100,
          reason: 'Manually selected',
        })))
      : selectBestVehicle(companyId, { origin_lat: originLat, origin_lng: originLng, total_weight_tons: totalWeight }),
    preferredDriverId
      ? Driver.find({ _id: preferredDriverId, company_id: companyId }).lean().then(r => r.map(d => ({
          driver_id: d._id, name: d.name, phone: d.phone, license: d.license_number, score: 100,
          reason: 'Manually selected',
        })))
      : selectBestDriver(companyId, { origin_lat: originLat, origin_lng: originLng }),
  ]);

  const weatherImpact = getWeatherImpact(weather);
  const trafficImpact = getTrafficImpact(traffic);

  // Order stops using nearest-neighbour heuristic
  const orderedStops = orderStops(originLat, originLng, stops);

  // Calculate total distance
  let totalDistKm = 0;
  let prevLat = originLat, prevLng = originLng;
  for (const stop of orderedStops) {
    if (stop.lat && stop.lng) {
      totalDistKm += haversine(prevLat, prevLng, stop.lat, stop.lng);
      prevLat = stop.lat; prevLng = stop.lng;
    } else {
      totalDistKm += 80; // default segment estimate
    }
  }
  if (routeType === 'round_trip') totalDistKm *= 2;

  // Unoptimized distance (straight-line sum without ordering)
  const unoptimizedDist = stops.reduce((sum, s) => {
    return sum + (s.lat && s.lng ? haversine(originLat, originLng, s.lat, s.lng) : 80);
  }, 0);

  // Fuel calculations
  const bestVehicle  = vehicleCandidates[0];
  const fuelMult     = weatherImpact.fuel_multiplier * (trafficImpact.congestion_level === 'high' ? 1.1 : 1.0);
  const fuelMetrics  = calculateFuel({
    distanceKm:     totalDistKm,
    vehicleType:    bestVehicle?.vehicle_type || 'truck',
    loadTons:       totalWeight,
    capacityTons:   bestVehicle?.capacity_tons || 10,
    fuelMultiplier: fuelMult,
    dieselPricePerL: dieselPrice,
  });

  const savingData = computeFuelSaving({
    originalDistanceKm:  unoptimizedDist,
    optimizedDistanceKm: totalDistKm,
    vehicleType:         bestVehicle?.vehicle_type || 'truck',
    loadTons:            totalWeight,
    capacityTons:        bestVehicle?.capacity_tons || 10,
    dieselPricePerL:     dieselPrice,
  });

  // AI recommendation
  const aiResult = await getAIRecommendation({
    shipments, vehicleCandidates, driverCandidates,
    weatherImpact, trafficImpact,
    fuelMetrics, optimizationType, totalDistanceKm: totalDistKm,
  });

  // Assign ETAs
  const delayMin = (trafficImpact.delay_minutes || 0) + (weatherImpact.delay_minutes || 0);
  const baseSpeed = trafficImpact.congestion_level === 'severe' ? 25
    : trafficImpact.congestion_level === 'high'  ? 35
    : trafficImpact.congestion_level === 'moderate' ? 45 : 55;
  const stopsWithETA = assignETAs(orderedStops, originLat, originLng, baseSpeed, delayMin);

  // Optimization score
  const optScore = computeOptimizationScore({
    fuelSavingPercent: savingData.saving_percent,
    delayRisk:         aiResult.delay_risk || 'low',
    optimizationType,
    weatherRisk:       weatherImpact.driving_risk,
    trafficLevel:      trafficImpact.congestion_level,
  }) + (aiResult.optimization_score_adjustment || 0);

  const estimatedDurationMin = Math.round((totalDistKm / baseSpeed) * 60) + delayMin;

  return {
    stops:              stopsWithETA,
    total_distance_km:  parseFloat(totalDistKm.toFixed(2)),
    estimated_duration_min: estimatedDurationMin,
    optimization_score: Math.max(0, Math.min(100, optScore)),

    fuel_cost_estimated:   savingData.original.fuel_cost,
    fuel_cost_optimized:   savingData.optimized.fuel_cost,
    fuel_saving:           savingData.fuel_saving,
    co2_emission_kg:       fuelMetrics.co2_emission_kg,

    vehicle_candidates:    vehicleCandidates,
    driver_candidates:     driverCandidates,
    best_vehicle:          vehicleCandidates[0] || null,
    best_driver:           driverCandidates[0]  || null,

    weather_summary:       weatherImpact.weather_summary,
    traffic_summary:       trafficImpact.traffic_summary,
    weather_alerts:        weatherImpact.weather_alerts,
    traffic_alerts:        trafficImpact.traffic_alerts,
    delay_risk:            aiResult.delay_risk || 'low',
    delay_risk_reason:     aiResult.delay_risk_reason || '',

    ai_recommendation:     aiResult.recommendation,
    ai_reasoning:          aiResult.reasoning,
    ai_risks:              aiResult.risks || [],
    ai_alternatives:       [],
  };
}

module.exports = { optimizeRoute, selectBestVehicle, selectBestDriver };
