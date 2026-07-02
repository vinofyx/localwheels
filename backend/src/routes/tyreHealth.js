const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const TyreHealth = require('../models/TyreHealth');
const VehicleTelemetry = require('../models/VehicleTelemetry');
const FleetVehicle = require('../models/FleetVehicle');

const SAFE_MIN_PSI = 28, SAFE_MAX_PSI = 36, WARN_PSI = 25;

function tyrePressureStatus(psi) {
  if (!psi) return 'good';
  if (psi < 10) return 'flat';
  if (psi < WARN_PSI) return 'critical';
  if (psi < SAFE_MIN_PSI) return 'low_pressure';
  if (psi > SAFE_MAX_PSI + 5) return 'high_temp';
  return 'good';
}

function tyreHealthPct(psi) {
  if (!psi) return 100;
  if (psi < 10) return 0;
  if (psi < WARN_PSI) return 20;
  if (psi < SAFE_MIN_PSI) return 60;
  if (psi > SAFE_MAX_PSI + 5) return 70;
  return 100;
}

// POST /api/tyre-health/assess/:vehicleId
router.post('/assess/:vehicleId', auth, async (req, res) => {
  try {
    const vehicle = await FleetVehicle.findOne({ _id: req.params.vehicleId, company_id: req.user.company_id });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Get latest tyre telemetry
    const latest = await VehicleTelemetry.findOne({
      fleet_vehicle_id: vehicle._id,
      company_id: req.user.company_id,
      'tyres.fl_pressure': { $exists: true },
    }).sort({ recorded_at: -1 }).select('tyres');

    // If no telemetry, use provided values from body
    const tyreData = latest?.tyres || req.body.tyres_manual || {};

    const positions = [
      { position: 'FL', pressure: tyreData.fl_pressure, temp: tyreData.fl_temp },
      { position: 'FR', pressure: tyreData.fr_pressure, temp: tyreData.fr_temp },
      { position: 'RL', pressure: tyreData.rl_pressure, temp: tyreData.rl_temp },
      { position: 'RR', pressure: tyreData.rr_pressure, temp: tyreData.rr_temp },
    ];

    const tyres = positions.map(t => ({
      position: t.position,
      pressure_psi: t.pressure,
      temperature: t.temp,
      health_pct: tyreHealthPct(t.pressure),
      status: tyrePressureStatus(t.pressure),
    }));

    const criticalTyres = tyres.filter(t => ['flat','critical'].includes(t.status)).length;
    const overallHealth = Math.round(tyres.reduce((s, t) => s + t.health_pct, 0) / tyres.length);
    const urgentAction = criticalTyres > 0;

    let recommendation = '';
    const lowTyres = tyres.filter(t => t.status === 'low_pressure' || t.status === 'critical' || t.status === 'flat');
    if (urgentAction) recommendation = `URGENT: ${criticalTyres} tyre(s) critically low. Do not operate vehicle.`;
    else if (lowTyres.length) recommendation = `${lowTyres.map(t => t.position).join(', ')} tyres have low pressure — inflate to ${SAFE_MIN_PSI}-${SAFE_MAX_PSI} PSI`;
    else recommendation = 'Tyre pressures are within safe range. Maintain regular monthly checks.';

    const record = await TyreHealth.create({
      company_id: req.user.company_id,
      fleet_vehicle_id: vehicle._id,
      vehicle_number: vehicle.vehicle_number,
      overall_health_pct: overallHealth,
      critical_tyres: criticalTyres,
      tyres,
      ai_recommendation: recommendation,
      urgent_action_needed: urgentAction,
    });

    res.status(201).json({ record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tyre-health — list
router.get('/', auth, async (req, res) => {
  try {
    const { urgent_only, vehicle_id, page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (urgent_only === 'true') filter.urgent_action_needed = true;
    if (vehicle_id) filter.fleet_vehicle_id = vehicle_id;

    const [records, total] = await Promise.all([
      TyreHealth.find(filter)
        .populate('fleet_vehicle_id', 'vehicle_number make model')
        .sort({ assessed_at: -1 })
        .skip((page-1)*limit)
        .limit(parseInt(limit)),
      TyreHealth.countDocuments(filter),
    ]);

    const urgentCount = await TyreHealth.countDocuments({ company_id: req.user.company_id, urgent_action_needed: true });

    res.json({ records, total, page: parseInt(page), urgent_vehicles: urgentCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tyre-health/:vehicleId/history
router.get('/:vehicleId/history', auth, async (req, res) => {
  try {
    const records = await TyreHealth.find({
      company_id: req.user.company_id,
      fleet_vehicle_id: req.params.vehicleId,
    }).sort({ assessed_at: -1 }).limit(20);
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tyre-health/fleet-assess — assess all vehicles
router.post('/fleet-assess', auth, async (req, res) => {
  try {
    const vehicles = await FleetVehicle.find({ company_id: req.user.company_id, is_active: true }).limit(50);
    res.json({ message: `Assessment started for ${vehicles.length} vehicles` });

    setImmediate(async () => {
      for (const v of vehicles) {
        try {
          const latest = await VehicleTelemetry.findOne({ fleet_vehicle_id: v._id, 'tyres.fl_pressure': { $exists: true } }).sort({ recorded_at: -1 }).select('tyres');
          if (!latest?.tyres) continue;
          const td = latest.tyres;
          const positions = [
            { position: 'FL', pressure: td.fl_pressure, temp: td.fl_temp },
            { position: 'FR', pressure: td.fr_pressure, temp: td.fr_temp },
            { position: 'RL', pressure: td.rl_pressure, temp: td.rl_temp },
            { position: 'RR', pressure: td.rr_pressure, temp: td.rr_temp },
          ];
          const tyres = positions.map(t => ({ position: t.position, pressure_psi: t.pressure, temperature: t.temp, health_pct: tyreHealthPct(t.pressure), status: tyrePressureStatus(t.pressure) }));
          const critical = tyres.filter(t => ['flat','critical'].includes(t.status)).length;
          await TyreHealth.create({ company_id: v.company_id, fleet_vehicle_id: v._id, vehicle_number: v.vehicle_number, overall_health_pct: Math.round(tyres.reduce((s,t) => s+t.health_pct,0)/4), critical_tyres: critical, tyres, urgent_action_needed: critical > 0 });
        } catch { /* skip */ }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
