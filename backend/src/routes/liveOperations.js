const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const FleetVehicle = require('../models/FleetVehicle');
const Driver = require('../models/Driver');
const Shipment = require('../models/Shipment');
const Dock = require('../models/Dock');
const WarehouseBin = require('../models/WarehouseBin');
const GPSLog = require('../models/GPSLog');
const RiskAssessment = require('../models/RiskAssessment');
const EnterpriseAlert = require('../models/EnterpriseAlert');

const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg, status = 400) => res.status(status).json({ status: false, message: msg });

// GET /api/live-operations/vehicles
router.get('/vehicles', auth, async (req, res) => {
  try {
    const vehicles = await FleetVehicle.find({ company_id: req.user.company_id, is_active: true })
      .select('registration_number make model status current_location fuel_level driver_id').lean();
    const gpsMap = {};
    try {
      const logs = await GPSLog.find({ company_id: req.user.company_id, timestamp: { $gte: new Date(Date.now() - 3600000) } })
        .sort({ timestamp: -1 }).lean();
      logs.forEach(g => { if (!gpsMap[String(g.vehicle_id)]) gpsMap[String(g.vehicle_id)] = g; });
    } catch { /* GPS optional */ }
    const result = vehicles.map(v => ({ ...v, last_gps: gpsMap[String(v._id)] || null }));
    ok(res, { vehicles: result, total: result.length, active: result.filter(v => v.status === 'active').length });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/live-operations/drivers
router.get('/drivers', auth, async (req, res) => {
  try {
    const drivers = await Driver.find({ company_id: req.user.company_id, is_active: true })
      .select('name phone status current_vehicle_id license_number').lean();
    ok(res, { drivers, total: drivers.length, on_duty: drivers.filter(d => d.status === 'active').length });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/live-operations/shipments
router.get('/shipments', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const q = { company_id: req.user.company_id };
    if (status) q.status = status;
    else q.status = { $in: ['in_transit','out_for_delivery','delayed'] };
    const shipments = await Shipment.find(q).select('lr_number status consignee_name destination_city estimated_delivery').limit(50).lean();
    ok(res, { shipments, total: shipments.length });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/live-operations/warehouse-capacity
router.get('/warehouse-capacity', auth, async (req, res) => {
  try {
    const [total, empty, docks, availDocks] = await Promise.all([
      WarehouseBin.countDocuments({ company_id: req.user.company_id }),
      WarehouseBin.countDocuments({ company_id: req.user.company_id, status: 'empty' }),
      Dock.countDocuments({ company_id: req.user.company_id }),
      Dock.countDocuments({ company_id: req.user.company_id, status: 'available' }),
    ]);
    const occupied = total - empty;
    ok(res, { total_bins: total, occupied_bins: occupied, empty_bins: empty, utilization_pct: total > 0 ? Math.round((occupied / total) * 100) : 0, total_docks: docks, available_docks: availDocks, occupied_docks: docks - availDocks });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/live-operations/kpi-wall
router.get('/kpi-wall', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [deliveredToday, inTransit, delayed, activeVehicles, activeDrivers, openAlerts, activeRisks] = await Promise.all([
      Shipment.countDocuments({ company_id: cid, status: 'delivered', updatedAt: { $gte: today } }),
      Shipment.countDocuments({ company_id: cid, status: 'in_transit' }),
      Shipment.countDocuments({ company_id: cid, status: { $in: ['delayed','on_hold'] } }),
      FleetVehicle.countDocuments({ company_id: cid, status: 'active' }),
      Driver.countDocuments({ company_id: cid, status: 'active' }),
      EnterpriseAlert.countDocuments({ company_id: cid, is_resolved: false }),
      RiskAssessment.countDocuments({ company_id: cid, status: 'active' }),
    ]);
    ok(res, { delivered_today: deliveredToday, in_transit: inTransit, delayed, active_vehicles: activeVehicles, active_drivers: activeDrivers, open_alerts: openAlerts, active_risks: activeRisks, updated_at: new Date() });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
