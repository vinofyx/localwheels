const RouteLearning  = require('../models/RouteLearning');
const DriverFatigue  = require('../models/DriverFatigue');
const DockSchedule   = require('../models/DockSchedule');
const FuelStation    = require('../models/FuelStation');
const RouteRisk      = require('../models/RouteRisk');
const Trip           = require('../models/Trip');
const { haversine }  = require('./trafficEngine');

const MAX_DAILY_HOURS    = 10;
const MAX_WEEKLY_HOURS   = 60;
const MIN_REST_HOURS     = 8;
const MAX_CONTINUOUS_HOURS = 5;

// ─── Self-Learning Route AI ───────────────────────────────────────────────────
// Records the outcome of a completed trip vs. what was predicted, building a
// dataset that future optimizations can be validated against.
async function recordRouteOutcome({ companyId, routeId, tripId, vehicleId, driverId, predicted, actual, customerFeedbackScore }) {
  const eta_error_min  = actual.duration_min != null && predicted.duration_min != null ? actual.duration_min - predicted.duration_min : null;
  const fuel_error_l   = actual.fuel_l != null && predicted.fuel_l != null ? actual.fuel_l - predicted.fuel_l : null;

  return RouteLearning.create({
    company_id: companyId, route_id: routeId, trip_id: tripId, vehicle_id: vehicleId, driver_id: driverId,
    predicted_duration_min: predicted.duration_min, actual_duration_min: actual.duration_min,
    predicted_fuel_l: predicted.fuel_l, actual_fuel_l: actual.fuel_l,
    predicted_distance_km: predicted.distance_km, actual_distance_km: actual.distance_km,
    eta_error_min, fuel_error_l, delay_min: eta_error_min > 0 ? eta_error_min : 0,
    customer_feedback_score: customerFeedbackScore,
  });
}

// ─── Aggregate learning insights to bias future predictions ───────────────────
async function getLearningInsights(companyId) {
  const since = new Date(Date.now() - 90 * 86400000);
  const records = await RouteLearning.find({ company_id: companyId, createdAt: { $gte: since } }).lean();
  if (!records.length) {
    return { sample_size: 0, avg_eta_error_min: 0, avg_fuel_error_l: 0, eta_bias_factor: 1, fuel_bias_factor: 1, recommendation: 'Insufficient data yet — using base estimates' };
  }

  const etaErrors  = records.filter(r => r.eta_error_min != null).map(r => r.eta_error_min);
  const fuelErrors = records.filter(r => r.fuel_error_l != null).map(r => r.fuel_error_l);
  const avgEta  = etaErrors.length ? etaErrors.reduce((a, b) => a + b, 0) / etaErrors.length : 0;
  const avgFuel = fuelErrors.length ? fuelErrors.reduce((a, b) => a + b, 0) / fuelErrors.length : 0;

  // bias factor used to nudge future predictions toward observed reality
  const avgPredictedDuration = records.reduce((s, r) => s + (r.predicted_duration_min || 0), 0) / records.length || 1;
  const avgPredictedFuel     = records.reduce((s, r) => s + (r.predicted_fuel_l || 0), 0) / records.length || 1;

  return {
    sample_size: records.length,
    avg_eta_error_min: Math.round(avgEta),
    avg_fuel_error_l:  Math.round(avgFuel * 10) / 10,
    eta_bias_factor:   Math.round((1 + avgEta / avgPredictedDuration) * 1000) / 1000,
    fuel_bias_factor:  Math.round((1 + avgFuel / avgPredictedFuel) * 1000) / 1000,
    recommendation: avgEta > 15 ? 'ETA predictions consistently optimistic — consider increasing buffer time' :
                     avgEta < -15 ? 'ETA predictions consistently conservative — routes finishing faster than planned' :
                     'Predictions are well calibrated',
  };
}

// ─── Driver Fatigue Detection ──────────────────────────────────────────────────
async function checkDriverFatigue({ companyId, driverId }) {
  const now = new Date();
  const dayStart  = new Date(now); dayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now.getTime() - 7 * 86400000);

  const trips = await Trip.find({
    company_id: companyId, driver_id: driverId,
    status: { $in: ['completed', 'in_progress'] },
    createdAt: { $gte: weekStart },
  }).lean();

  const minutesToHours = m => (m || 0) / 60;
  let hoursToday = 0, hoursWeek = 0, lastTripEnd = null;

  for (const t of trips) {
    const durationMin = t.actual_duration_min || t.estimated_duration_min || 0;
    hoursWeek += minutesToHours(durationMin);
    if (t.createdAt >= dayStart) hoursToday += minutesToHours(durationMin);
    const end = t.completed_at || t.updatedAt;
    if (!lastTripEnd || (end && end > lastTripEnd)) lastTripEnd = end;
  }

  const hoursSinceRest = lastTripEnd ? (now - new Date(lastTripEnd)) / 3600000 : 99;
  const continuousHours = hoursSinceRest < MIN_REST_HOURS ? hoursToday : 0;

  let fatigueReason = null;
  if (hoursToday >= MAX_DAILY_HOURS) fatigueReason = 'exceeded_daily_limit';
  else if (hoursWeek >= MAX_WEEKLY_HOURS) fatigueReason = 'exceeded_weekly_limit';
  else if (continuousHours >= MAX_CONTINUOUS_HOURS) fatigueReason = 'continuous_driving';
  else if (hoursSinceRest < MIN_REST_HOURS && hoursToday > 0) fatigueReason = 'insufficient_rest';

  const record = await DriverFatigue.findOneAndUpdate(
    { company_id: companyId, driver_id: driverId, period_date: dayStart },
    {
      hours_driven_today: Math.round(hoursToday * 10) / 10,
      hours_driven_week:  Math.round(hoursWeek * 10) / 10,
      continuous_hours:    Math.round(continuousHours * 10) / 10,
      last_trip_end_at:     lastTripEnd,
      is_fatigued:           !!fatigueReason,
      fatigue_reason:         fatigueReason,
      is_overtime:             hoursWeek > 48,
      is_eligible_for_assignment: !fatigueReason,
    },
    { upsert: true, new: true }
  );

  return record;
}

// ─── Dock Scheduling ────────────────────────────────────────────────────────────
async function getDockAvailability({ companyId, warehouseId, fromTime, toTime }) {
  const filter = { company_id: companyId, status: { $in: ['scheduled', 'in_progress'] } };
  if (warehouseId) filter.warehouse_id = warehouseId;
  if (fromTime || toTime) {
    filter.slot_start = {};
    if (fromTime) filter.slot_start.$gte = new Date(fromTime);
    if (toTime)   filter.slot_start.$lte = new Date(toTime);
  }
  return DockSchedule.find(filter).sort('slot_start').lean();
}

async function reserveDockSlot({ companyId, warehouseId, dockNumber, vehicleId, tripId, dispatchPlanId, slotStart, slotEnd, purpose }) {
  const overlapping = await DockSchedule.findOne({
    company_id: companyId, warehouse_id: warehouseId, dock_number: dockNumber,
    status: { $in: ['scheduled', 'in_progress'] },
    slot_start: { $lt: new Date(slotEnd) }, slot_end: { $gt: new Date(slotStart) },
  });
  if (overlapping) return { success: false, conflict: overlapping };

  const booking = await DockSchedule.create({
    company_id: companyId, warehouse_id: warehouseId, dock_number: dockNumber,
    vehicle_id: vehicleId, trip_id: tripId, dispatch_plan_id: dispatchPlanId,
    slot_start: slotStart, slot_end: slotEnd, purpose: purpose || 'loading',
  });
  return { success: true, booking };
}

// ─── Fuel Station Recommendation ────────────────────────────────────────────────
async function recommendFuelStations({ companyId, lat, lng, radiusKm = 15, limit = 5 }) {
  const stations = await FuelStation.find({ company_id: companyId, is_active: true }).lean();
  return stations
    .map(s => ({ ...s, distance_km: Math.round(haversine(lat, lng, s.lat, s.lng) * 10) / 10 }))
    .filter(s => s.distance_km <= radiusKm)
    .sort((a, b) => (a.is_preferred === b.is_preferred ? a.fuel_price_per_l - b.fuel_price_per_l : a.is_preferred ? -1 : 1))
    .slice(0, limit);
}

// ─── AI Route Risk Score ────────────────────────────────────────────────────────
async function calculateRouteRisk({ companyId, routeId, trafficLevel, weatherSeverity, distanceKm, isNightTime }) {
  // Deterministic, explainable scoring — each factor 0-100, weighted blend
  const trafficRisk  = trafficLevel === 'severe' ? 80 : trafficLevel === 'heavy' ? 55 : trafficLevel === 'moderate' ? 30 : 10;
  const weatherRisk    = weatherSeverity === 'severe' ? 85 : weatherSeverity === 'moderate' ? 45 : 10;
  const roadQualityRisk = distanceKm > 300 ? 40 : distanceKm > 100 ? 20 : 10;
  const incidentHistoryRisk = 15; // baseline until incident-history dataset exists
  const crimeZoneRisk    = isNightTime ? 30 : 10;

  const weighted = trafficRisk * 0.3 + weatherRisk * 0.25 + roadQualityRisk * 0.15 + incidentHistoryRisk * 0.15 + crimeZoneRisk * 0.15;
  const overall = Math.round(weighted);

  const riskLevel = overall >= 70 ? 'critical' : overall >= 50 ? 'high' : overall >= 25 ? 'medium' : 'low';

  const factors = [];
  if (trafficRisk >= 55) factors.push('heavy_traffic');
  if (weatherRisk >= 45) factors.push('adverse_weather');
  if (roadQualityRisk >= 40) factors.push('long_distance_road_wear');
  if (isNightTime) factors.push('night_travel');

  const risk = await RouteRisk.create({
    company_id: companyId, route_id: routeId,
    traffic_risk: trafficRisk, weather_risk: weatherRisk, road_quality_risk: roadQualityRisk,
    incident_history_risk: incidentHistoryRisk, crime_zone_risk: crimeZoneRisk,
    overall_risk_score: overall, risk_level: riskLevel, contributing_factors: factors,
    ai_confidence: 75,
    ai_reasoning: `Risk driven primarily by ${factors[0] || 'baseline conditions'}; traffic=${trafficRisk}, weather=${weatherRisk}, road=${roadQualityRisk}.`,
  });

  return risk;
}

module.exports = {
  recordRouteOutcome, getLearningInsights,
  checkDriverFatigue,
  getDockAvailability, reserveDockSlot,
  recommendFuelStations,
  calculateRouteRisk,
};
