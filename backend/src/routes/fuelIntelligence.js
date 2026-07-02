const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate: auth } = require('../middleware/auth');
const FuelIntelligence = require('../models/FuelIntelligence');
const VehicleTelemetry = require('../models/VehicleTelemetry');
const FleetVehicle = require('../models/FleetVehicle');

const anthropic = new Anthropic();

function detectAnomalies(readings) {
  const events = [];
  let prevLevel = null;
  readings.forEach((r, i) => {
    const level = r.fuel?.level_liters;
    if (level == null) return;
    if (prevLevel !== null) {
      const delta = level - prevLevel;
      if (delta < -10) {
        events.push({
          event_type: Math.abs(delta) > 20 ? 'theft_suspected' : 'unusual_drain',
          timestamp: r.recorded_at,
          fuel_level_before: prevLevel,
          fuel_level_after: level,
          delta_liters: Math.abs(delta),
          location: r.gps ? { lat: r.gps.lat, lng: r.gps.lng } : null,
          severity: Math.abs(delta) > 20 ? 'critical' : 'warning',
          description: Math.abs(delta) > 20 ? `Suspected fuel theft: ${Math.abs(delta).toFixed(1)}L drop` : `Unusual drain: ${Math.abs(delta).toFixed(1)}L`,
        });
      } else if (delta > 5) {
        events.push({ event_type: 'refuel', timestamp: r.recorded_at, fuel_level_before: prevLevel, fuel_level_after: level, delta_liters: delta, severity: 'info', description: `Refuel: +${delta.toFixed(1)}L` });
      }
    }
    prevLevel = level;
  });
  return events;
}

// POST /api/fuel-intelligence/analyze/:vehicleId — analyze fuel data
router.post('/analyze/:vehicleId', auth, async (req, res) => {
  try {
    const { days = 7 } = req.body;
    const vehicle = await FleetVehicle.findOne({ _id: req.params.vehicleId, company_id: req.user.company_id });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const telemetry = await VehicleTelemetry.find({
      company_id: req.user.company_id,
      fleet_vehicle_id: vehicle._id,
      recorded_at: { $gte: since },
    }).sort({ recorded_at: 1 }).select('fuel motion gps engine.idle_time_min recorded_at').limit(2000);

    if (telemetry.length < 2) {
      return res.json({ message: 'Insufficient telemetry data', minimum_required: 2, available: telemetry.length });
    }

    // Calculate metrics
    const first = telemetry[0], last = telemetry[telemetry.length - 1];
    const fuelConsumed = (first.fuel?.level_liters || 0) - (last.fuel?.level_liters || 0);
    const distance = (last.motion?.odometer || 0) - (first.motion?.odometer || 0);
    const avgMileage = distance > 0 && fuelConsumed > 0 ? distance / fuelConsumed : null;
    const idleMinTotal = telemetry.reduce((s, t) => s + (t.engine?.idle_time_min || 0), 0);
    const idleFuel = idleMinTotal * 0.3 / 60; // ~0.3L/hr idle

    const events = detectAnomalies(telemetry);
    const theftEvents = events.filter(e => e.event_type === 'theft_suspected');

    // AI insights
    let aiInsights = null, recommendations = [];
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Fuel analysis for logistics vehicle ${vehicle.vehicle_number}. Distance: ${distance}km, Fuel consumed: ${fuelConsumed.toFixed(1)}L, Mileage: ${avgMileage?.toFixed(2) || 'N/A'} km/L, Expected: ${vehicle.fuel_efficiency || 12}km/L, Theft events: ${theftEvents.length}, Idle fuel waste: ${idleFuel.toFixed(1)}L. Return JSON: {"insights": "one paragraph summary", "recommendations": ["up to 3 specific actions"]}`,
        }],
      });
      const p = JSON.parse(msg.content[0].text.replace(/```json\n?|\n?```/g, '').trim());
      aiInsights = p.insights;
      recommendations = p.recommendations || [];
    } catch {
      recommendations = [];
      if (theftEvents.length > 0) recommendations.push('Investigate suspicious fuel drops immediately');
      if (avgMileage && vehicle.fuel_efficiency && avgMileage < vehicle.fuel_efficiency * 0.85) recommendations.push('Fuel efficiency below expected — check tyre pressure and engine');
      if (idleFuel > 5) recommendations.push('Reduce idle time to save fuel costs');
    }

    const efficiencyPct = avgMileage && vehicle.fuel_efficiency ? Math.round((avgMileage / vehicle.fuel_efficiency) * 100) : null;
    const fuelPrice = 105; // INR/L estimate

    const record = await FuelIntelligence.create({
      company_id: req.user.company_id,
      fleet_vehicle_id: vehicle._id,
      vehicle_number: vehicle.vehicle_number,
      period_start: since,
      period_end: new Date(),
      period_days: days,
      total_fuel_consumed_l: Math.max(0, fuelConsumed),
      total_distance_km: Math.max(0, distance),
      avg_mileage_kmpl: avgMileage ? parseFloat(avgMileage.toFixed(2)) : null,
      expected_mileage_kmpl: vehicle.fuel_efficiency || null,
      efficiency_pct: efficiencyPct,
      total_fuel_cost: Math.max(0, fuelConsumed) * fuelPrice,
      theft_risk: theftEvents.length > 2 ? 'high' : theftEvents.length > 0 ? 'medium' : 'none',
      theft_events: theftEvents.length,
      suspected_theft_liters: theftEvents.reduce((s, e) => s + (e.delta_liters || 0), 0),
      anomaly_events: events.filter(e => e.event_type !== 'refuel').length,
      events,
      idle_fuel_consumed_l: parseFloat(idleFuel.toFixed(2)),
      idle_waste_pct: Math.max(0, fuelConsumed) > 0 ? Math.round((idleFuel / Math.max(0, fuelConsumed)) * 100) : 0,
      ai_insights: aiInsights,
      recommendations,
    });

    res.status(201).json({ record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fuel-intelligence — list fuel intelligence records
router.get('/', auth, async (req, res) => {
  try {
    const { theft_risk, vehicle_id, page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (theft_risk) filter.theft_risk = theft_risk;
    if (vehicle_id) filter.fleet_vehicle_id = vehicle_id;

    const [records, total] = await Promise.all([
      FuelIntelligence.find(filter)
        .populate('fleet_vehicle_id', 'vehicle_number make model')
        .sort({ calculated_at: -1 })
        .skip((page-1)*limit)
        .limit(parseInt(limit)),
      FuelIntelligence.countDocuments(filter),
    ]);

    const summary = await FuelIntelligence.aggregate([
      { $match: { company_id: req.user.company_id } },
      { $group: { _id: null, total_fuel: { $sum: '$total_fuel_consumed_l' }, total_cost: { $sum: '$total_fuel_cost' }, total_theft_events: { $sum: '$theft_events' }, avg_mileage: { $avg: '$avg_mileage_kmpl' }, avg_efficiency: { $avg: '$efficiency_pct' } } },
    ]);

    res.json({ records, total, page: parseInt(page), summary: summary[0] || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fuel-intelligence/theft-alerts — active theft suspicions
router.get('/theft-alerts', auth, async (req, res) => {
  try {
    const alerts = await FuelIntelligence.find({
      company_id: req.user.company_id,
      theft_risk: { $in: ['medium','high'] },
    }).populate('fleet_vehicle_id', 'vehicle_number').sort({ calculated_at: -1 }).limit(20);
    res.json({ alerts, count: alerts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/fuel-intelligence/fleet-summary — fleet-wide fuel KPIs
router.get('/fleet-summary', auth, async (req, res) => {
  try {
    const vehicles = await FleetVehicle.find({ company_id: req.user.company_id, is_active: true }).select('_id vehicle_number').limit(50);
    const latest = await Promise.all(vehicles.map(async (v) => {
      const r = await FuelIntelligence.findOne({ fleet_vehicle_id: v._id }).sort({ calculated_at: -1 }).select('avg_mileage_kmpl efficiency_pct theft_risk total_fuel_cost vehicle_number');
      return r ? r.toObject() : { vehicle_number: v.vehicle_number, avg_mileage_kmpl: null, efficiency_pct: null, theft_risk: 'none', total_fuel_cost: 0 };
    }));
    res.json({ fleet: latest, total_vehicles: vehicles.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
