const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Shipment = require('../models/Shipment');
const Complaint = require('../models/Complaint');
const ExecutiveDashboard = require('../models/ExecutiveDashboard');
const ExecutiveAlert = require('../models/ExecutiveAlert');
const BusinessInsight = require('../models/BusinessInsight');

// Pull live KPIs from existing collections
async function buildLiveKPIs(company_id) {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    shipmentsToday,
    shipmentsMonth,
    deliveredToday,
    delayedToday,
    pendingToday,
    complaintsOpen,
    criticalAlerts,
  ] = await Promise.all([
    Shipment.countDocuments({ company_id, createdAt: { $gte: todayStart } }).catch(() => 0),
    Shipment.countDocuments({ company_id, createdAt: { $gte: monthStart } }).catch(() => 0),
    Shipment.countDocuments({ company_id, status: 'delivered', updatedAt: { $gte: todayStart } }).catch(() => 0),
    Shipment.countDocuments({ company_id, status: { $in: ['delayed','in_transit'] }, expected_delivery: { $lt: now } }).catch(() => 0),
    Shipment.countDocuments({ company_id, status: { $in: ['booked','dispatched','in_transit'] } }).catch(() => 0),
    Complaint.countDocuments({ company_id, status: { $in: ['open','in_progress'] } }).catch(() => 0),
    ExecutiveAlert.countDocuments({ company_id, severity: 'critical', is_resolved: false }).catch(() => 0),
  ]);

  // Revenue from payment totals — try to aggregate from Shipments freight field
  const revenueAgg = await Shipment.aggregate([
    { $match: { company_id, createdAt: { $gte: monthStart } } },
    { $group: { _id: null, total: { $sum: '$freight_charges' } } },
  ]).catch(() => []);
  const revenueTodayAgg = await Shipment.aggregate([
    { $match: { company_id, createdAt: { $gte: todayStart } } },
    { $group: { _id: null, total: { $sum: '$freight_charges' } } },
  ]).catch(() => []);

  return {
    revenue_today: revenueTodayAgg[0]?.total || 0,
    revenue_month: revenueAgg[0]?.total || 0,
    shipments_today: shipmentsToday,
    shipments_month: shipmentsMonth,
    delivered_today: deliveredToday,
    delayed_today: delayedToday,
    pending_today: pendingToday,
    complaints_open: complaintsOpen,
    critical_alerts: criticalAlerts,
  };
}

// GET /api/executive/kpis — live KPI snapshot
router.get('/kpis', auth, async (req, res) => {
  try {
    const kpis = await buildLiveKPIs(req.user.company_id);
    res.json({ kpis, generated_at: new Date() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/executive/summary — dashboard snapshot (cached or live)
router.get('/summary', auth, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    let snap = await ExecutiveDashboard.findOne({
      company_id: req.user.company_id,
      period: 'daily',
      snapshot_date: today,
    });

    if (!snap) {
      const kpis = await buildLiveKPIs(req.user.company_id);
      snap = await ExecutiveDashboard.findOneAndUpdate(
        { company_id: req.user.company_id, period: 'daily', snapshot_date: today },
        { ...kpis, company_id: req.user.company_id, period: 'daily', snapshot_date: today },
        { upsert: true, new: true }
      );
    }

    const [recentAlerts, recentInsights] = await Promise.all([
      ExecutiveAlert.find({ company_id: req.user.company_id, is_resolved: false }).sort({ createdAt: -1 }).limit(5),
      BusinessInsight.find({ company_id: req.user.company_id }).sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({ summary: snap, alerts: recentAlerts, insights: recentInsights });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/executive/snapshot — force refresh snapshot
router.post('/snapshot', auth, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const kpis = await buildLiveKPIs(req.user.company_id);
    const snap = await ExecutiveDashboard.findOneAndUpdate(
      { company_id: req.user.company_id, period: 'daily', snapshot_date: today },
      { ...kpis, company_id: req.user.company_id, period: 'daily', snapshot_date: today },
      { upsert: true, new: true }
    );
    res.json({ snapshot: snap, message: 'Snapshot refreshed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/executive/trend — revenue + shipment trend (last N days)
router.get('/trend', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const from = new Date();
    from.setDate(from.getDate() - parseInt(days));

    const [revTrend, shipTrend] = await Promise.all([
      Shipment.aggregate([
        { $match: { company_id: req.user.company_id, createdAt: { $gte: from } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$freight_charges' },
          count: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ['$status','delivered'] }, 1, 0] } },
        }},
        { $sort: { _id: 1 } },
      ]).catch(() => []),
    ]);

    res.json({ trend: revTrend, days: parseInt(days) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/executive/branch-performance — per-branch KPIs
router.get('/branch-performance', auth, async (req, res) => {
  try {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);

    const data = await Shipment.aggregate([
      { $match: { company_id: req.user.company_id, createdAt: { $gte: monthStart } } },
      { $group: {
        _id: '$branch_id',
        shipments: { $sum: 1 },
        delivered: { $sum: { $cond: [{ $eq: ['$status','delivered'] }, 1, 0] } },
        delayed: { $sum: { $cond: [{ $in: ['$status',['delayed']] }, 1, 0] } },
        revenue: { $sum: '$freight_charges' },
      }},
      { $sort: { revenue: -1 } },
    ]).catch(() => []);

    res.json({ branches: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
