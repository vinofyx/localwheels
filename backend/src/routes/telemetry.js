const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticate: auth } = require('../middleware/auth');
const VehicleTelemetry = require('../models/VehicleTelemetry');
const IoTDevice = require('../models/IoTDevice');
const FleetVehicle = require('../models/FleetVehicle');

// Device-authenticated middleware
async function deviceAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.body.api_key;
  const deviceId = req.headers['x-device-id'] || req.body.device_id;
  if (!apiKey || !deviceId) return res.status(401).json({ error: 'x-api-key and x-device-id headers required' });

  const device = await IoTDevice.findOne({ device_id: deviceId, is_active: true });
  if (!device) return res.status(404).json({ error: 'Device not found' });

  const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
  if (hash !== device.api_key_hash && apiKey !== device.api_key) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  req.device = device;
  next();
}

// POST /api/telemetry — receive single telemetry packet from device
router.post('/', deviceAuth, async (req, res) => {
  try {
    const device = req.device;
    const { gps, engine, motion, electrical, fuel, tyres, environment, dtc_codes, signal_strength, recorded_at } = req.body;

    const telemetry = await VehicleTelemetry.create({
      company_id:       device.company_id,
      fleet_vehicle_id: device.fleet_vehicle_id,
      device_id:        device._id,
      vehicle_number:   device.vehicle_number,
      gps, engine, motion, electrical, fuel, tyres, environment,
      dtc_codes: dtc_codes || [],
      signal_strength,
      recorded_at: recorded_at ? new Date(recorded_at) : new Date(),
    });

    // Update device last_telemetry
    await IoTDevice.updateOne({ _id: device._id }, {
      last_seen: new Date(),
      last_telemetry: new Date(),
      status: 'online',
      $inc: { telemetry_count: 1 },
    });

    res.status(201).json({ ok: true, telemetry_id: telemetry._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/telemetry/batch — receive batch telemetry (up to 100 packets)
router.post('/batch', deviceAuth, async (req, res) => {
  try {
    const device = req.device;
    const { packets } = req.body;
    if (!Array.isArray(packets) || packets.length === 0) return res.status(400).json({ error: 'packets array required' });

    const docs = packets.slice(0, 100).map(p => ({
      company_id:       device.company_id,
      fleet_vehicle_id: device.fleet_vehicle_id,
      device_id:        device._id,
      vehicle_number:   device.vehicle_number,
      gps: p.gps, engine: p.engine, motion: p.motion,
      electrical: p.electrical, fuel: p.fuel, tyres: p.tyres,
      environment: p.environment,
      dtc_codes: p.dtc_codes || [],
      signal_strength: p.signal_strength,
      recorded_at: p.recorded_at ? new Date(p.recorded_at) : new Date(),
    }));

    const inserted = await VehicleTelemetry.insertMany(docs, { ordered: false });
    await IoTDevice.updateOne({ _id: device._id }, {
      last_seen: new Date(),
      last_telemetry: new Date(),
      status: 'online',
      $inc: { telemetry_count: inserted.length },
    });

    res.status(201).json({ ok: true, inserted: inserted.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/telemetry/simulate — simulate telemetry for a vehicle (staff use)
router.post('/simulate', auth, async (req, res) => {
  try {
    const { fleet_vehicle_id, count = 10 } = req.body;
    if (!fleet_vehicle_id) return res.status(400).json({ error: 'fleet_vehicle_id required' });

    const vehicle = await FleetVehicle.findOne({ _id: fleet_vehicle_id, company_id: req.user.company_id });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const now = Date.now();
    const docs = Array.from({ length: Math.min(count, 50) }, (_, i) => ({
      company_id:       req.user.company_id,
      fleet_vehicle_id: vehicle._id,
      vehicle_number:   vehicle.vehicle_number,
      gps: {
        lat: 28.6139 + (Math.random() - 0.5) * 0.1,
        lng: 77.2090 + (Math.random() - 0.5) * 0.1,
        heading: Math.floor(Math.random() * 360),
      },
      engine: {
        rpm:           800 + Math.floor(Math.random() * 2200),
        coolant_temp:  75 + Math.floor(Math.random() * 25),
        oil_pressure:  250 + Math.floor(Math.random() * 150),
        engine_load:   20 + Math.floor(Math.random() * 60),
        engine_hours:  1200 + i,
        idle_time_min: Math.floor(Math.random() * 30),
      },
      motion: {
        speed:    Math.floor(Math.random() * 80),
        odometer: 45000 + i,
        acceleration: (Math.random() - 0.5) * 4,
        harsh_brake: Math.random() < 0.05,
        harsh_acceleration: Math.random() < 0.03,
      },
      electrical: {
        battery_voltage: 12.0 + Math.random() * 2.5,
        alternator_output: 13.5 + Math.random() * 1,
        charging_status: 'charging',
      },
      fuel: {
        level_pct: 40 + Math.floor(Math.random() * 55),
        level_liters: 30 + Math.floor(Math.random() * 40),
        consumption_rate: 10 + Math.random() * 5,
      },
      tyres: {
        fl_pressure: 30 + Math.random() * 5,
        fr_pressure: 30 + Math.random() * 5,
        rl_pressure: 30 + Math.random() * 5,
        rr_pressure: 30 + Math.random() * 5,
      },
      recorded_at: new Date(now - (count - i) * 30000),
    }));

    const inserted = await VehicleTelemetry.insertMany(docs);
    res.status(201).json({ ok: true, inserted: inserted.length, vehicle_number: vehicle.vehicle_number });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/telemetry/live/:vehicleId — latest telemetry for a vehicle
router.get('/live/:vehicleId', auth, async (req, res) => {
  try {
    const latest = await VehicleTelemetry.findOne({
      company_id: req.user.company_id,
      fleet_vehicle_id: req.params.vehicleId,
    }).sort({ recorded_at: -1 });

    if (!latest) return res.json({ data: null, message: 'No telemetry yet' });
    res.json({ data: latest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/telemetry/history/:vehicleId — telemetry history with time filter
router.get('/history/:vehicleId', auth, async (req, res) => {
  try {
    const { from, to, limit = 100 } = req.query;
    const filter = { company_id: req.user.company_id, fleet_vehicle_id: req.params.vehicleId };
    if (from || to) {
      filter.recorded_at = {};
      if (from) filter.recorded_at.$gte = new Date(from);
      if (to)   filter.recorded_at.$lte = new Date(to);
    }

    const data = await VehicleTelemetry.find(filter)
      .sort({ recorded_at: -1 })
      .limit(Math.min(parseInt(limit), 500))
      .select('gps engine.rpm engine.coolant_temp motion.speed motion.odometer electrical.battery_voltage fuel.level_pct recorded_at');

    res.json({ data, count: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/telemetry/fleet-snapshot — latest reading for all fleet vehicles
router.get('/fleet-snapshot', auth, async (req, res) => {
  try {
    const vehicles = await FleetVehicle.find({ company_id: req.user.company_id, is_active: true })
      .select('vehicle_number vehicle_type').limit(100);

    const snapshots = await Promise.all(vehicles.map(async (v) => {
      const t = await VehicleTelemetry.findOne({ fleet_vehicle_id: v._id }).sort({ recorded_at: -1 })
        .select('gps motion.speed fuel.level_pct electrical.battery_voltage engine.coolant_temp recorded_at');
      return { vehicle: v, telemetry: t };
    }));

    res.json({ snapshots, total: vehicles.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
