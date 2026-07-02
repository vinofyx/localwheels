const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const BatteryHealth = require('../models/BatteryHealth');
const VehicleTelemetry = require('../models/VehicleTelemetry');
const FleetVehicle = require('../models/FleetVehicle');

function batteryHealthPct(voltage, minVolt = 11.5, maxVolt = 14.5) {
  const pct = ((voltage - minVolt) / (maxVolt - minVolt)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function batteryStatus(healthPct) {
  if (healthPct >= 80) return 'excellent';
  if (healthPct >= 65) return 'good';
  if (healthPct >= 45) return 'fair';
  if (healthPct >= 25) return 'replace_soon';
  return 'replace_now';
}

// POST /api/battery-health/assess/:vehicleId
router.post('/assess/:vehicleId', auth, async (req, res) => {
  try {
    const vehicle = await FleetVehicle.findOne({ _id: req.params.vehicleId, company_id: req.user.company_id });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const telemetry = await VehicleTelemetry.find({
      company_id: req.user.company_id,
      fleet_vehicle_id: vehicle._id,
      recorded_at: { $gte: since },
      'electrical.battery_voltage': { $exists: true },
    }).select('electrical recorded_at').limit(1000);

    const latest = await VehicleTelemetry.findOne({ fleet_vehicle_id: vehicle._id }).sort({ recorded_at: -1 }).select('electrical');

    if (!telemetry.length && !latest) {
      return res.json({ message: 'No electrical telemetry available' });
    }

    let totalVolt = 0, minVolt = 99, maxVolt = 0, lowEvents = 0, dropEvents = 0;
    let prevVolt = null;

    telemetry.forEach(t => {
      const v = t.electrical?.battery_voltage || 0;
      if (!v) return;
      totalVolt += v;
      minVolt = Math.min(minVolt, v);
      maxVolt = Math.max(maxVolt, v);
      if (v < 12.0) lowEvents++;
      if (prevVolt !== null && v < prevVolt - 0.5) dropEvents++;
      prevVolt = v;
    });

    const count = telemetry.length || 1;
    const avgVolt = count > 0 ? totalVolt / count : (latest?.electrical?.battery_voltage || 12.5);
    const currentVolt = latest?.electrical?.battery_voltage || avgVolt;
    const healthPct = batteryHealthPct(currentVolt);
    const status = batteryStatus(healthPct);

    const replacementMonths = healthPct >= 80 ? 24 : healthPct >= 65 ? 12 : healthPct >= 45 ? 6 : 2;
    const replacementDate = new Date(Date.now() + replacementMonths * 30 * 24 * 60 * 60 * 1000);

    let recommendation = null, urgency = 'none';
    if (status === 'replace_now') { recommendation = 'Replace battery immediately — critically low health'; urgency = 'immediate'; }
    else if (status === 'replace_soon') { recommendation = 'Plan battery replacement within 2 months'; urgency = 'urgent'; }
    else if (status === 'fair') { recommendation = 'Monitor battery closely — performance declining'; urgency = 'plan'; }
    else { recommendation = 'Battery health is acceptable — maintain regular monitoring'; urgency = 'none'; }

    const record = await BatteryHealth.create({
      company_id: req.user.company_id,
      fleet_vehicle_id: vehicle._id,
      vehicle_number: vehicle.vehicle_number,
      health_pct: healthPct,
      health_status: status,
      soc: batteryHealthPct(currentVolt, 11.5, 12.7),
      voltage_current: parseFloat(currentVolt.toFixed(2)),
      current_amps: latest?.electrical?.battery_current,
      charging_status: latest?.electrical?.charging_status || 'idle',
      alternator_output: latest?.electrical?.alternator_output,
      avg_voltage: parseFloat(avgVolt.toFixed(2)),
      min_voltage: minVolt < 99 ? parseFloat(minVolt.toFixed(2)) : null,
      max_voltage: parseFloat(maxVolt.toFixed(2)),
      voltage_drop_events: dropEvents,
      low_voltage_events: lowEvents,
      estimated_remaining_months: replacementMonths,
      replacement_date_prediction: replacementDate,
      ai_recommendation: recommendation,
      replacement_urgency: urgency,
    });

    res.status(201).json({ record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/battery-health — list battery health records
router.get('/', auth, async (req, res) => {
  try {
    const { health_status, urgency, vehicle_id, page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (health_status) filter.health_status = health_status;
    if (urgency) filter.replacement_urgency = urgency;
    if (vehicle_id) filter.fleet_vehicle_id = vehicle_id;

    const [records, total] = await Promise.all([
      BatteryHealth.find(filter)
        .populate('fleet_vehicle_id', 'vehicle_number make model')
        .sort({ assessed_at: -1 })
        .skip((page-1)*limit)
        .limit(parseInt(limit)),
      BatteryHealth.countDocuments(filter),
    ]);

    const criticalCount = await BatteryHealth.countDocuments({ company_id: req.user.company_id, replacement_urgency: { $in: ['immediate','urgent'] } });

    res.json({ records, total, page: parseInt(page), critical_batteries: criticalCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/battery-health/:vehicleId/history
router.get('/:vehicleId/history', auth, async (req, res) => {
  try {
    const records = await BatteryHealth.find({
      company_id: req.user.company_id,
      fleet_vehicle_id: req.params.vehicleId,
    }).sort({ assessed_at: -1 }).limit(30).select('health_pct health_status voltage_current avg_voltage assessed_at');
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
