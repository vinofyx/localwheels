const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticate: auth } = require('../middleware/auth');
const IoTDevice = require('../models/IoTDevice');
const VehicleTelemetry = require('../models/VehicleTelemetry');
const FleetVehicle = require('../models/FleetVehicle');

// POST /api/iot/register — register a new device
router.post('/register', auth, async (req, res) => {
  try {
    const { device_id, device_type, fleet_vehicle_id, firmware_version, hardware_version, sim_number, imei, notes } = req.body;
    if (!device_id) return res.status(400).json({ error: 'device_id required' });

    const existing = await IoTDevice.findOne({ device_id });
    if (existing) return res.status(409).json({ error: 'Device already registered', device: existing });

    const api_key = crypto.randomBytes(32).toString('hex');
    const api_key_hash = crypto.createHash('sha256').update(api_key).digest('hex');

    let vehicle_number;
    if (fleet_vehicle_id) {
      const v = await FleetVehicle.findById(fleet_vehicle_id).select('vehicle_number');
      vehicle_number = v?.vehicle_number;
    }

    const device = await IoTDevice.create({
      company_id: req.user.company_id,
      device_id,
      device_type: device_type || 'telematics_unit',
      fleet_vehicle_id,
      vehicle_number,
      firmware_version,
      hardware_version,
      sim_number,
      imei,
      api_key,
      api_key_hash,
      status: 'offline',
      is_active: true,
      installed_by: req.user.id,
      installed_at: new Date(),
      notes,
    });

    res.status(201).json({ message: 'Device registered', device_id: device._id, api_key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/iot/heartbeat — device sends heartbeat (authenticated by device api_key)
router.post('/heartbeat', async (req, res) => {
  try {
    const { device_id, battery_level, signal_strength, firmware_version } = req.body;
    const apiKey = req.headers['x-api-key'] || req.body.api_key;
    if (!device_id || !apiKey) return res.status(400).json({ error: 'device_id and api_key required' });

    const device = await IoTDevice.findOne({ device_id });
    if (!device) return res.status(404).json({ error: 'Device not found' });

    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    if (keyHash !== device.api_key_hash && apiKey !== device.api_key) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const now = new Date();
    const update = {
      last_heartbeat: now,
      last_seen: now,
      status: 'online',
      battery_level: battery_level ?? device.battery_level,
      signal_strength: signal_strength ?? device.signal_strength,
    };
    if (firmware_version) update.firmware_version = firmware_version;

    await IoTDevice.updateOne({ device_id }, update);
    res.json({ ok: true, config: device.config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/iot/devices — list all devices
router.get('/devices', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status) filter.status = status;

    const [devices, total] = await Promise.all([
      IoTDevice.find(filter)
        .select('-api_key -api_key_hash')
        .populate('fleet_vehicle_id', 'vehicle_number vehicle_type')
        .sort({ last_seen: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      IoTDevice.countDocuments(filter),
    ]);

    // Mark offline devices (no heartbeat in last 10 min)
    const offlineThreshold = new Date(Date.now() - 10 * 60 * 1000);
    const enriched = devices.map(d => {
      const obj = d.toObject();
      if (obj.last_seen && obj.last_seen < offlineThreshold && obj.status === 'online') {
        obj.status = 'offline';
      }
      return obj;
    });

    const stats = {
      total,
      online: enriched.filter(d => d.status === 'online').length,
      offline: enriched.filter(d => d.status === 'offline').length,
      error: enriched.filter(d => d.status === 'error').length,
    };

    res.json({ devices: enriched, total, stats, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/iot/devices/:id — single device
router.get('/devices/:id', auth, async (req, res) => {
  try {
    const device = await IoTDevice.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .select('-api_key -api_key_hash')
      .populate('fleet_vehicle_id', 'vehicle_number vehicle_type make model');
    if (!device) return res.status(404).json({ error: 'Device not found' });

    const recentTelemetry = await VehicleTelemetry.findOne({ device_id: device._id })
      .sort({ recorded_at: -1 });

    res.json({ device, recent_telemetry: recentTelemetry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/iot/devices/:id — update device config/assignment
router.put('/devices/:id', auth, async (req, res) => {
  try {
    const { fleet_vehicle_id, status, config, notes, firmware_version } = req.body;
    const update = {};
    if (fleet_vehicle_id !== undefined) {
      update.fleet_vehicle_id = fleet_vehicle_id;
      if (fleet_vehicle_id) {
        const v = await FleetVehicle.findById(fleet_vehicle_id).select('vehicle_number');
        if (v) update.vehicle_number = v.vehicle_number;
      }
    }
    if (status) update.status = status;
    if (config) update.config = config;
    if (notes !== undefined) update.notes = notes;
    if (firmware_version) update.firmware_version = firmware_version;

    const device = await IoTDevice.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      update, { new: true }
    ).select('-api_key -api_key_hash');
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json({ device });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/iot/devices/:id/rotate-key — generate new API key
router.post('/devices/:id/rotate-key', auth, async (req, res) => {
  try {
    const api_key = crypto.randomBytes(32).toString('hex');
    const api_key_hash = crypto.createHash('sha256').update(api_key).digest('hex');
    const device = await IoTDevice.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { api_key, api_key_hash }, { new: true }
    );
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json({ message: 'API key rotated', api_key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/iot/offline — devices that have gone offline
router.get('/offline', auth, async (req, res) => {
  try {
    const threshold = new Date(Date.now() - 10 * 60 * 1000);
    const devices = await IoTDevice.find({
      company_id: req.user.company_id,
      is_active: true,
      $or: [
        { status: 'offline' },
        { last_seen: { $lt: threshold }, status: 'online' },
      ],
    }).select('-api_key -api_key_hash').populate('fleet_vehicle_id', 'vehicle_number');
    res.json({ devices, count: devices.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
