const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const WarehouseAnalytics = require('../models/WarehouseAnalytics');
const WarehouseForecast = require('../models/WarehouseForecast');
const Inventory = require('../models/Inventory');
const InventoryMovement = require('../models/InventoryMovement');
const InboundShipment = require('../models/InboundShipment');
const OutboundShipment = require('../models/OutboundShipment');
const WarehouseBin = require('../models/WarehouseBin');
const WarehouseTask = require('../models/WarehouseTask');
const WarehouseWorker = require('../models/WarehouseWorker');

// POST /api/warehouse-analytics/snapshot — generate analytics snapshot
router.post('/snapshot', auth, async (req, res) => {
  try {
    const { warehouse_id, period = 'daily' } = req.body;
    if (!warehouse_id) return res.status(400).json({ error: 'warehouse_id required' });
    const cid = req.user.company_id;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [totalBins, emptyBins, totalInv, inboundToday, outboundToday, movements, workers] = await Promise.all([
      WarehouseBin.countDocuments({ company_id: cid, warehouse_id }),
      WarehouseBin.countDocuments({ company_id: cid, warehouse_id, status: 'empty' }),
      Inventory.aggregate([{ $match: { company_id: cid, warehouse_id: require('mongoose').Types.ObjectId.createFromHexString(warehouse_id) } }, { $group: { _id: null, total_qty: { $sum: '$quantity' }, total_value: { $sum: '$total_value' }, sku_count: { $sum: 1 } } }]),
      InboundShipment.countDocuments({ company_id: cid, warehouse_id, createdAt: { $gte: today } }),
      OutboundShipment.countDocuments({ company_id: cid, warehouse_id, createdAt: { $gte: today } }),
      InventoryMovement.countDocuments({ company_id: cid, warehouse_id, performed_at: { $gte: today } }),
      WarehouseWorker.find({ company_id: cid, warehouse_id, status: 'active' }).lean(),
    ]);

    const occupiedBins = totalBins - emptyBins;
    const utilization = totalBins > 0 ? Math.round((occupiedBins / totalBins) * 100) : 0;
    const invStats = totalInv[0] || { total_qty: 0, total_value: 0, sku_count: 0 };
    const workerProductivity = workers.length > 0 ? Math.round(workers.reduce((s, w) => s + (w.productivity_score || 100), 0) / workers.length) : 100;

    const analytics = await WarehouseAnalytics.create({
      company_id: cid, warehouse_id, period, period_date: today,
      utilization_pct: utilization, total_bins: totalBins, occupied_bins: occupiedBins, empty_bins: emptyBins,
      total_inventory_value: invStats.total_value, total_sku_count: invStats.sku_count, total_qty: invStats.total_qty,
      inbound_count: inboundToday, outbound_count: outboundToday, total_movements: movements,
      worker_productivity_avg: workerProductivity,
      inventory_accuracy_pct: 98.5,
      generated_at: new Date(),
    });

    res.json({ analytics, message: 'Snapshot generated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/warehouse-analytics — list analytics
router.get('/', auth, async (req, res) => {
  try {
    const { warehouse_id, period, limit = 30 } = req.query;
    const q = { company_id: req.user.company_id };
    if (warehouse_id) q.warehouse_id = warehouse_id;
    if (period) q.period = period;
    const analytics = await WarehouseAnalytics.find(q).sort({ period_date: -1 }).limit(Number(limit)).lean();
    res.json({ analytics, count: analytics.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/warehouse-analytics/dashboard — live KPI dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    const cid = req.user.company_id;
    const q = { company_id: cid };
    if (warehouse_id) q.warehouse_id = warehouse_id;

    const ObjId = require('mongoose').Types.ObjectId;
    const cidObj = ObjId.isValid(cid) ? new ObjId(cid) : cid;
    const wId = warehouse_id ? new ObjId(warehouse_id) : null;
    const invQ = wId ? { company_id: cidObj, warehouse_id: wId } : { company_id: cidObj };

    const [totalBins, emptyBins, invStats, pendingInbound, pendingOutbound, pendingTasks, activeRecs, forecasts] = await Promise.all([
      WarehouseBin.countDocuments(q),
      WarehouseBin.countDocuments({ ...q, status: 'empty' }),
      Inventory.aggregate([{ $match: invQ }, { $group: { _id: null, total_skus: { $sum: 1 }, total_qty: { $sum: '$quantity' }, total_value: { $sum: '$total_value' }, low_stock: { $sum: { $cond: [{ $lte: ['$quantity', 10] }, 1, 0] } } } }]),
      InboundShipment.countDocuments({ ...q, status: { $in: ['scheduled', 'arrived', 'unloading', 'receiving'] } }),
      OutboundShipment.countDocuments({ ...q, status: { $in: ['pending', 'allocated', 'pick_list_generated', 'picking', 'packing'] } }),
      WarehouseTask.countDocuments({ ...q, status: { $in: ['pending', 'assigned', 'in_progress'] } }),
      require('../models/WarehouseAIRecommendation').countDocuments({ ...q, status: 'active' }),
      WarehouseForecast.find({ ...q, risk_level: { $in: ['high', 'critical'] }, is_actioned: false }).sort({ risk_level: 1 }).limit(5).lean(),
    ]);

    const is = invStats[0] || {};
    const utilization = totalBins > 0 ? Math.round(((totalBins - emptyBins) / totalBins) * 100) : 0;

    res.json({
      kpis: {
        utilization_pct: utilization,
        total_bins: totalBins, empty_bins: emptyBins,
        total_skus: is.total_skus || 0, total_qty: is.total_qty || 0,
        total_inventory_value: is.total_value || 0,
        low_stock_count: is.low_stock || 0,
        pending_inbound: pendingInbound, pending_outbound: pendingOutbound,
        pending_tasks: pendingTasks, active_ai_recommendations: activeRecs,
      },
      critical_forecasts: forecasts,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/warehouse-analytics/inventory-turnover
router.get('/inventory-turnover', auth, async (req, res) => {
  try {
    const { warehouse_id, days = 30 } = req.query;
    const cid = req.user.company_id;
    const since = new Date(Date.now() - Number(days) * 86400000);
    const q = { company_id: cid };
    if (warehouse_id) q.warehouse_id = warehouse_id;
    const movements = await InventoryMovement.aggregate([
      { $match: { ...q, movement_type: { $in: ['dispatch', 'pick'] }, performed_at: { $gte: since } } },
      { $group: { _id: '$sku', total_dispatched: { $sum: '$quantity' } } },
      { $sort: { total_dispatched: -1 } },
      { $limit: 20 },
    ]);
    const invBySkus = await Inventory.find({ ...q, sku: { $in: movements.map(m => m._id) } }).lean();
    const result = movements.map(m => {
      const inv = invBySkus.find(i => i.sku === m._id);
      return { sku: m._id, product_name: inv?.product_name, total_dispatched: m.total_dispatched, current_stock: inv?.quantity || 0, avg_daily_consumption: (m.total_dispatched / Number(days)).toFixed(2) };
    });
    res.json({ top_movers: result, period_days: Number(days), from: since });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/warehouse-analytics/forecasts
router.get('/forecasts', auth, async (req, res) => {
  try {
    const { warehouse_id, risk_level, limit = 20 } = req.query;
    const baseQ = { company_id: req.user.company_id };
    if (warehouse_id) baseQ.warehouse_id = warehouse_id;
    const q = { ...baseQ };
    if (risk_level) q.risk_level = risk_level;
    const [forecasts, total, critical, high, stockout7d] = await Promise.all([
      WarehouseForecast.find(q).sort({ days_until_stockout: 1, risk_level: -1, createdAt: -1 }).limit(Number(limit)).lean(),
      WarehouseForecast.countDocuments(baseQ),
      WarehouseForecast.countDocuments({ ...baseQ, risk_level: 'critical' }),
      WarehouseForecast.countDocuments({ ...baseQ, risk_level: 'high' }),
      WarehouseForecast.countDocuments({ ...baseQ, days_until_stockout: { $lte: 7 } }),
    ]);
    res.json({ forecasts, total, count: forecasts.length, summary: { total, critical, high, medium: total - critical - high, stockout_7d: stockout7d } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
