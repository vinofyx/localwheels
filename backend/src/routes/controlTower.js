const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const ControlTowerEvent = require('../models/ControlTowerEvent');
const EnterpriseAlert = require('../models/EnterpriseAlert');
const LiveOperationsSnapshot = require('../models/LiveOperationsSnapshot');
const Shipment = require('../models/Shipment');
const FleetVehicle = require('../models/FleetVehicle');
const Driver = require('../models/Driver');
const WarehouseBin = require('../models/WarehouseBin');
const Dock = require('../models/Dock');
const Incident = require('../models/Incident');
const RiskAssessment = require('../models/RiskAssessment');

const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg, status = 400) => res.status(status).json({ status: false, message: msg });

// GET /api/control-tower/dashboard — enterprise-wide live KPIs
router.get('/dashboard', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const ObjId = require('mongoose').Types.ObjectId;
    const cidObj = ObjId.isValid(cid) ? new ObjId(cid) : cid;

    const [
      totalShipments, inTransit, delivered, delayed,
      totalVehicles, activeVehicles,
      totalDrivers, activeDrivers,
      totalBins, emptyBins,
      openDocks,
      openAlerts, criticalAlerts,
      openIncidents,
      activeRisks,
    ] = await Promise.all([
      Shipment.countDocuments({ company_id: cid }),
      Shipment.countDocuments({ company_id: cid, status: 'in_transit' }),
      Shipment.countDocuments({ company_id: cid, status: 'delivered' }),
      Shipment.countDocuments({ company_id: cid, status: { $in: ['delayed','on_hold'] } }),
      FleetVehicle.countDocuments({ company_id: cid, is_active: true }),
      FleetVehicle.countDocuments({ company_id: cid, status: 'active' }),
      Driver.countDocuments({ company_id: cid, is_active: true }),
      Driver.countDocuments({ company_id: cid, status: 'active' }),
      WarehouseBin.countDocuments({ company_id: cid }),
      WarehouseBin.countDocuments({ company_id: cid, status: 'empty' }),
      Dock.countDocuments({ company_id: cid, status: 'available' }),
      EnterpriseAlert.countDocuments({ company_id: cid, is_resolved: false }),
      EnterpriseAlert.countDocuments({ company_id: cid, is_resolved: false, severity: 'critical' }),
      Incident.countDocuments({ company_id: cid, status: { $in: ['open','investigating','escalated'] } }),
      RiskAssessment.countDocuments({ company_id: cid, status: 'active' }),
    ]);

    const warehouseUtil = totalBins > 0 ? Math.round(((totalBins - emptyBins) / totalBins) * 100) : 0;
    const fleetUtil = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

    const snapshot = await LiveOperationsSnapshot.create({
      company_id: cid,
      vehicles_active: activeVehicles, vehicles_idle: totalVehicles - activeVehicles,
      drivers_on_duty: activeDrivers, drivers_available: totalDrivers - activeDrivers,
      shipments_in_transit: inTransit, shipments_delayed: delayed, shipments_delivered: delivered,
      docks_available: openDocks,
      warehouse_capacity_pct: warehouseUtil,
      open_alerts: openAlerts, open_incidents: openIncidents, active_risks: activeRisks,
    });

    ok(res, {
      shipments: { total: totalShipments, in_transit: inTransit, delivered, delayed },
      fleet: { total: totalVehicles, active: activeVehicles, utilization_pct: fleetUtil },
      drivers: { total: totalDrivers, active: activeDrivers },
      warehouse: { utilization_pct: warehouseUtil, total_bins: totalBins, empty_bins: emptyBins, available_docks: openDocks },
      alerts: { total: openAlerts, critical: criticalAlerts },
      incidents: { open: openIncidents },
      risks: { active: activeRisks },
      snapshot_id: snapshot._id,
    });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/control-tower/alerts
router.get('/alerts', auth, async (req, res) => {
  try {
    const { is_resolved = 'false', severity, limit = 30 } = req.query;
    const q = { company_id: req.user.company_id, is_resolved: is_resolved === 'true' };
    if (severity) q.severity = severity;
    const alerts = await EnterpriseAlert.find(q).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    ok(res, { alerts, total: alerts.length });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/control-tower/alerts
router.post('/alerts', auth, async (req, res) => {
  try {
    const { type, severity, title, message, source, entity_type, entity_id, metadata } = req.body;
    if (!title) return err(res, 'title required');
    const alert = await EnterpriseAlert.create({ company_id: req.user.company_id, type, severity, title, message, source, entity_type, entity_id, metadata, auto_generated: false });
    ok(res, alert, 'Alert created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/control-tower/alerts/:id/resolve
router.put('/alerts/:id/resolve', auth, async (req, res) => {
  try {
    const alert = await EnterpriseAlert.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { is_resolved: true, resolved_by: req.user.id, resolved_at: new Date() } },
      { new: true }
    );
    if (!alert) return err(res, 'Alert not found', 404);
    ok(res, alert, 'Alert resolved');
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/control-tower/events
router.get('/events', auth, async (req, res) => {
  try {
    const { handled, limit = 50 } = req.query;
    const q = { company_id: req.user.company_id };
    if (handled !== undefined) q.handled = handled === 'true';
    const events = await ControlTowerEvent.find(q).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    ok(res, { events, total: events.length });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/control-tower/live-feed — combined live feed
router.get('/live-feed', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const since = new Date(Date.now() - 2 * 3600000);
    const [alerts, events, incidents] = await Promise.all([
      EnterpriseAlert.find({ company_id: cid, is_resolved: false, createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(10).lean(),
      ControlTowerEvent.find({ company_id: cid, handled: false, createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(10).lean(),
      Incident.find({ company_id: cid, status: { $in: ['open','investigating'] }, createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);
    const feed = [
      ...alerts.map(a => ({ ...a, feed_type: 'alert' })),
      ...events.map(e => ({ ...e, feed_type: 'event' })),
      ...incidents.map(i => ({ ...i, feed_type: 'incident' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 30);
    ok(res, { feed, counts: { alerts: alerts.length, events: events.length, incidents: incidents.length } });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
