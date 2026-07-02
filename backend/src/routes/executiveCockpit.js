const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const ExecutiveSnapshot = require('../models/ExecutiveSnapshot');
const EnterpriseAnalytics = require('../models/EnterpriseAnalytics');
const Shipment = require('../models/Shipment');
const FleetVehicle = require('../models/FleetVehicle');
const Driver = require('../models/Driver');
const Incident = require('../models/Incident');
const RiskAssessment = require('../models/RiskAssessment');
const DecisionRecommendation = require('../models/DecisionRecommendation');
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const SalesOrder = require('../models/SalesOrder');
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic();

const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg, status = 400) => res.status(status).json({ status: false, message: msg });

const { cacheGet, cacheSet } = require('../middleware/cache');
// In-memory fallback cache (5-minute TTL) for when Redis is unavailable
const _memCache = new Map();
function memGet(k) { const e = _memCache.get(k); return e && e.exp > Date.now() ? e.v : null; }
function memSet(k, v, ttls) { _memCache.set(k, { v, exp: Date.now() + ttls * 1000 }); }

// GET /api/executive-cockpit/snapshot — generate and return live executive snapshot
router.get('/snapshot', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    // Cache snapshot for 5 minutes — AI call is expensive
    const cacheKey = `exec_snapshot:${cid}:${today.toISOString().slice(0,10)}`;
    const cached = (await cacheGet(cacheKey)) || memGet(cacheKey);
    if (cached) return ok(res, { ...cached, _cached: true });
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const ObjId = require('mongoose').Types.ObjectId;
    const cidObj = ObjId.isValid(cid) ? new ObjId(cid) : cid;

    const [
      shipmentsToday, delivered, inTransit, delayed,
      activeVehicles, totalVehicles,
      activeDrivers,
      openIncidents, criticalIncidents,
      activeRisks,
      pendingDecisions,
      soRevenue, poSpend,
    ] = await Promise.all([
      Shipment.countDocuments({ company_id: cid, createdAt: { $gte: today } }),
      Shipment.countDocuments({ company_id: cid, status: 'delivered', updatedAt: { $gte: today } }),
      Shipment.countDocuments({ company_id: cid, status: 'in_transit' }),
      Shipment.countDocuments({ company_id: cid, status: { $in: ['delayed','on_hold'] } }),
      FleetVehicle.countDocuments({ company_id: cid, status: 'active' }),
      FleetVehicle.countDocuments({ company_id: cid, is_active: true }),
      Driver.countDocuments({ company_id: cid, status: 'active' }),
      Incident.countDocuments({ company_id: cid, status: { $in: ['open','investigating','escalated'] } }),
      Incident.countDocuments({ company_id: cid, severity: 'critical', status: { $ne: 'closed' } }),
      RiskAssessment.countDocuments({ company_id: cid, status: 'active' }),
      DecisionRecommendation.countDocuments({ company_id: cid, status: 'pending' }),
      SalesOrder.aggregate([{ $match: { company_id: cidObj, createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
      PurchaseOrder.aggregate([{ $match: { company_id: cidObj, createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
    ]);

    const fleetUtil = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;
    const onTimePct = shipmentsToday > 0 ? Math.round(((shipmentsToday - delayed) / shipmentsToday) * 100) : 95;

    const kpis = {
      shipments_today: shipmentsToday, delivered_today: delivered, in_transit: inTransit, delayed,
      active_vehicles: activeVehicles, fleet_utilization_pct: fleetUtil,
      active_drivers: activeDrivers,
      open_incidents: openIncidents, critical_incidents: criticalIncidents,
      active_risks: activeRisks, pending_decisions: pendingDecisions,
      revenue_month: soRevenue[0]?.total || 0,
      spend_month: poSpend[0]?.total || 0,
      on_time_delivery_pct: onTimePct,
    };

    let ai_summary = '', ai_risks = [], ai_opportunities = [];
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001', max_tokens: 500,
        messages: [{ role: 'user', content: `Executive summary for logistics company. KPIs: ${JSON.stringify(kpis)}. Return JSON: {"summary":"2-sentence exec summary","risks":["risk1","risk2"],"opportunities":["opp1","opp2"]}` }],
      });
      const p = JSON.parse(msg.content[0].text.match(/\{[\s\S]*\}/)?.[0] || '{}');
      ai_summary = p.summary || '';
      ai_risks = p.risks || [];
      ai_opportunities = p.opportunities || [];
    } catch { /* skip */ }

    // Upsert snapshot — only one record per company per day
    const snapshot = await ExecutiveSnapshot.findOneAndUpdate(
      { company_id: cid, period: 'daily', snapshot_date: today },
      {
        company_id: cid, period: 'daily', snapshot_date: today,
        shipments_today: shipmentsToday, deliveries_today: delivered,
        active_vehicles: activeVehicles, active_drivers: activeDrivers,
        open_incidents: openIncidents, open_risks: activeRisks,
        fleet_utilization: fleetUtil, on_time_delivery_pct: onTimePct,
        revenue_month: soRevenue[0]?.total || 0,
        ai_summary, ai_risks, ai_opportunities,
      },
      { upsert: true, new: true }
    );

    const payload = { kpis, ai_summary, ai_risks, ai_opportunities, snapshot_id: snapshot._id };
    // Store in both Redis and in-memory cache for 5 minutes
    await cacheSet(cacheKey, payload, 300);
    memSet(cacheKey, payload, 300);
    ok(res, payload);
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/executive-cockpit/ceo
router.get('/ceo', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const ObjId = require('mongoose').Types.ObjectId;
    const cidObj = ObjId.isValid(cid) ? new ObjId(cid) : cid;
    const [soData, suppliers, incidents, risks] = await Promise.all([
      SalesOrder.aggregate([{ $match: { company_id: cidObj, createdAt: { $gte: monthStart } } }, { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$total_amount' } } }]),
      Supplier.find({ company_id: cid, status: { $in: ['active','approved'] } }).sort({ overall_score: -1 }).limit(5).select('name overall_score grade status').lean(),
      Incident.find({ company_id: cid, status: { $ne: 'closed' } }).sort({ severity: 1, createdAt: -1 }).limit(5).lean(),
      RiskAssessment.find({ company_id: cid, status: 'active' }).sort({ risk_score: -1 }).limit(5).lean(),
    ]);
    ok(res, { sales_orders: soData, top_suppliers: suppliers, open_incidents: incidents, top_risks: risks });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/executive-cockpit/coo
router.get('/coo', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [shipmentsToday, delayed, vehicles, drivers, openIncidents] = await Promise.all([
      Shipment.countDocuments({ company_id: cid, createdAt: { $gte: today } }),
      Shipment.countDocuments({ company_id: cid, status: { $in: ['delayed','on_hold'] } }),
      FleetVehicle.aggregate([{ $match: { company_id: ObjId.isValid(cid) ? new require('mongoose').Types.ObjectId(cid) : cid } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Driver.countDocuments({ company_id: cid, status: 'active' }),
      Incident.countDocuments({ company_id: cid, status: { $in: ['open','investigating'] } }),
    ]);
    ok(res, { shipments_today: shipmentsToday, delayed, vehicles_by_status: vehicles, active_drivers: drivers, open_incidents: openIncidents });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/executive-cockpit/cfo
router.get('/cfo', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const ObjId = require('mongoose').Types.ObjectId;
    const cidObj = ObjId.isValid(cid) ? new ObjId(cid) : cid;
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [soRevenue, poSpend, pendingSO, pendingPO] = await Promise.all([
      SalesOrder.aggregate([{ $match: { company_id: cidObj } }, { $group: { _id: null, total: { $sum: '$total_amount' }, paid: { $sum: '$paid_amount' }, unpaid: { $sum: { $subtract: ['$total_amount', '$paid_amount'] } } } }]),
      PurchaseOrder.aggregate([{ $match: { company_id: cidObj } }, { $group: { _id: null, total: { $sum: '$total_amount' }, paid: { $sum: '$paid_amount' } } }]),
      SalesOrder.countDocuments({ company_id: cid, payment_status: { $ne: 'paid' } }),
      PurchaseOrder.countDocuments({ company_id: cid, payment_status: { $ne: 'paid' } }),
    ]);
    ok(res, {
      revenue: { total: soRevenue[0]?.total || 0, collected: soRevenue[0]?.paid || 0, outstanding: soRevenue[0]?.unpaid || 0 },
      expenditure: { total: poSpend[0]?.total || 0, paid: poSpend[0]?.paid || 0 },
      pending_collections: pendingSO, pending_payments: pendingPO,
    });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/executive-cockpit/history
router.get('/history', auth, async (req, res) => {
  try {
    const snapshots = await ExecutiveSnapshot.find({ company_id: req.user.company_id }).sort({ snapshot_date: -1 }).limit(30).lean();
    ok(res, { snapshots });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
