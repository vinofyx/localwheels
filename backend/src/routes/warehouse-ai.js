const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');
const WarehouseAIRecommendation = require('../models/WarehouseAIRecommendation');
const WarehouseForecast = require('../models/WarehouseForecast');
const Inventory = require('../models/Inventory');
const WarehouseBin = require('../models/WarehouseBin');
const WarehouseZone = require('../models/WarehouseZone');
const WarehouseTask = require('../models/WarehouseTask');
const WarehouseWorker = require('../models/WarehouseWorker');

const anthropic = new Anthropic();

const VALID_REC_TYPES = ['bin_allocation','picking_route','replenishment','dock_scheduling','labour_optimization','space_optimization','cross_dock','congestion','temperature_alert','expiry_alert','slow_moving','fast_moving'];
function sanitizeRecType(t) { return VALID_REC_TYPES.includes(t) ? t : 'space_optimization'; }

// POST /api/warehouse-ai/suggest-bin — AI bin allocation for incoming SKU
router.post('/suggest-bin', auth, async (req, res) => {
  try {
    const { warehouse_id, sku, product_name, quantity, weight_kg, volume_cbm, zone_preference } = req.body;
    if (!warehouse_id || !sku) return res.status(400).json({ error: 'warehouse_id and sku required' });

    // Find empty bins
    const q = { company_id: req.user.company_id, warehouse_id, status: 'empty', is_active: true };
    if (zone_preference) q.zone_id = zone_preference;
    const emptyBins = await WarehouseBin.find(q).populate('zone_id', 'zone_code zone_type').populate('rack_id', 'rack_code').limit(20).lean();

    // Check if SKU already placed somewhere (same zone preferred)
    const existingPlacement = await Inventory.findOne({ company_id: req.user.company_id, warehouse_id, sku: sku.toUpperCase(), status: 'available' }).populate('bin_id').lean();

    // Rule-based suggestion (fast fallback)
    const suggested = emptyBins[0];

    // AI suggestion
    let ai_explanation = null;
    try {
      const prompt = `You are a warehouse management AI. Suggest the optimal bin for storing:
SKU: ${sku}, Product: ${product_name || sku}, Quantity: ${quantity || 0}, Weight: ${weight_kg || 0}kg, Volume: ${volume_cbm || 0}cbm.
Available empty bins: ${JSON.stringify(emptyBins.slice(0, 5).map(b => ({ bin: b.bin_code, zone: b.zone_id?.zone_code, max_weight: b.max_weight_kg, max_vol: b.max_volume_cbm })))}.
${existingPlacement ? `Same SKU already stored at bin: ${existingPlacement.bin_id?.bin_code}. Prefer consolidation.` : ''}
Respond with JSON: {"recommended_bin_code":"...", "reason":"...", "consolidate": true/false}`;
      const msg = await anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 300, messages: [{ role: 'user', content: prompt }] });
      const parsed = JSON.parse(msg.content[0].text.replace(/```json\n?|\n?```/g, '').trim());
      ai_explanation = parsed.reason;
      const aiSuggested = emptyBins.find(b => b.bin_code === parsed.recommended_bin_code);
      if (aiSuggested) {
        await WarehouseAIRecommendation.create({
          company_id: req.user.company_id, warehouse_id,
          recommendation_type: 'bin_allocation', priority: 'medium',
          title: `Optimal bin suggested for ${sku}`,
          ai_explanation: parsed.reason, sku, bin_code: parsed.recommended_bin_code,
          details: parsed, confidence_score: 0.85,
        });
        return res.json({ suggested_bin: aiSuggested, ai_explanation: parsed.reason, consolidate: parsed.consolidate || false, all_options: emptyBins.slice(0, 5) });
      }
    } catch { /* fallback to rule-based */ }

    res.json({ suggested_bin: suggested, ai_explanation: ai_explanation || 'First available empty bin', all_options: emptyBins.slice(0, 5) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/warehouse-ai/picking-route — optimize picking route for task
router.post('/picking-route', auth, async (req, res) => {
  try {
    const { warehouse_id, task_id, items } = req.body;
    const pickItems = items || (task_id ? (await WarehouseTask.findById(task_id).lean())?.items || [] : []);
    if (!pickItems.length) return res.status(400).json({ error: 'items required' });

    // Populate bin codes
    const enriched = [];
    for (const item of pickItems) {
      const bin = item.bin_id ? await WarehouseBin.findById(item.bin_id).populate('zone_id', 'zone_code').lean() : null;
      enriched.push({ ...item, bin_code: bin?.bin_code || item.bin_code, zone: bin?.zone_id?.zone_code });
    }

    // Sort by zone then bin (proximity-based)
    const sorted = enriched.sort((a, b) => {
      if ((a.zone || '') !== (b.zone || '')) return (a.zone || '').localeCompare(b.zone || '');
      return (a.bin_code || '').localeCompare(b.bin_code || '');
    });

    let ai_route = sorted.map((item, i) => ({ step: i + 1, bin_code: item.bin_code, sku: item.sku, qty: item.quantity }));
    let ai_explanation = 'Optimized by zone proximity and bin sequence.';
    let estimated_min = Math.ceil(pickItems.length * 2.5);

    try {
      const prompt = `Optimize this warehouse pick list for shortest travel time. Items: ${JSON.stringify(sorted.map(i => ({ sku: i.sku, bin: i.bin_code, qty: i.quantity })))}.
Return JSON: {"route":[{"step":1,"bin_code":"...","sku":"...","qty":0}], "estimated_minutes":N, "explanation":"..."}`;
      const msg = await anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 500, messages: [{ role: 'user', content: prompt }] });
      const parsed = JSON.parse(msg.content[0].text.replace(/```json\n?|\n?```/g, '').trim());
      if (parsed.route) ai_route = parsed.route;
      if (parsed.estimated_minutes) estimated_min = parsed.estimated_minutes;
      if (parsed.explanation) ai_explanation = parsed.explanation;
    } catch { /* fallback route used */ }

    if (task_id) await WarehouseTask.findByIdAndUpdate(task_id, { ai_picking_route: ai_route, estimated_duration_min: estimated_min });

    res.json({ optimized_route: ai_route, estimated_minutes: estimated_min, ai_explanation, total_picks: pickItems.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/warehouse-ai/analyze — full warehouse AI analysis
router.post('/analyze', auth, async (req, res) => {
  try {
    const { warehouse_id } = req.body;
    if (!warehouse_id) return res.status(400).json({ error: 'warehouse_id required' });

    const cid = req.user.company_id;
    const [totalBins, emptyBins, totalInv, lowStockItems, expiringSoon, zones] = await Promise.all([
      WarehouseBin.countDocuments({ company_id: cid, warehouse_id }),
      WarehouseBin.countDocuments({ company_id: cid, warehouse_id, status: 'empty' }),
      Inventory.countDocuments({ company_id: cid, warehouse_id }),
      Inventory.countDocuments({ company_id: cid, warehouse_id, quantity: { $lte: 10 } }),
      Inventory.countDocuments({ company_id: cid, warehouse_id, expiry_date: { $lte: new Date(Date.now() + 30 * 86400000), $gt: new Date() } }),
      WarehouseZone.find({ company_id: cid, warehouse_id }).lean(),
    ]);

    const utilization = totalBins > 0 ? Math.round(((totalBins - emptyBins) / totalBins) * 100) : 0;
    const recommendations = [];

    // Rule-based recommendations
    if (utilization > 85) recommendations.push({ type: 'space_optimization', priority: 'high', title: 'Warehouse Nearly Full', ai_explanation: `${utilization}% utilization. Consider overflow storage or slow-mover relocation.`, estimated_savings: 0 });
    if (lowStockItems > 0) recommendations.push({ type: 'replenishment', priority: 'medium', title: `${lowStockItems} Low Stock SKUs`, ai_explanation: 'Stock levels below threshold. Initiate replenishment orders.', estimated_savings: 0 });
    if (expiringSoon > 0) recommendations.push({ type: 'expiry_alert', priority: 'high', title: `${expiringSoon} Items Expiring in 30 Days`, ai_explanation: 'Prioritize FEFO (First Expiry First Out) picking for near-expiry items.', estimated_savings: 0 });

    // AI analysis
    let ai_summary = null;
    try {
      const prompt = `You are a warehouse AI. Analyze this warehouse: Utilization: ${utilization}%, Total bins: ${totalBins}, Empty: ${emptyBins}, Total SKUs: ${totalInv}, Low stock: ${lowStockItems}, Expiring soon: ${expiringSoon}, Zones: ${zones.length}.
Give 2-3 actionable recommendations. Return JSON: {"summary":"...","recommendations":[{"type":"...","title":"...","detail":"...","priority":"low/medium/high/critical","estimated_savings":N}]}`;
      const msg = await anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 600, messages: [{ role: 'user', content: prompt }] });
      const parsed = JSON.parse(msg.content[0].text.replace(/```json\n?|\n?```/g, '').trim());
      ai_summary = parsed.summary;
      for (const r of (parsed.recommendations || [])) {
        recommendations.push({ type: sanitizeRecType(r.type), priority: r.priority || 'medium', title: r.title, ai_explanation: r.detail, estimated_savings: r.estimated_savings || 0 });
      }
    } catch { ai_summary = `Warehouse is at ${utilization}% utilization with ${totalInv} active SKUs.`; }

    // Persist recommendations
    const created = [];
    for (const r of recommendations) {
      const rec = await WarehouseAIRecommendation.create({ company_id: cid, warehouse_id, recommendation_type: r.type, priority: r.priority, title: r.title, ai_explanation: r.ai_explanation, estimated_savings: r.estimated_savings || 0, confidence_score: 0.8 });
      created.push(rec);
    }

    res.json({ utilization_pct: utilization, total_bins: totalBins, empty_bins: emptyBins, total_inventory: totalInv, low_stock_skus: lowStockItems, expiring_soon: expiringSoon, ai_summary, recommendations: created });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/warehouse-ai/forecast — inventory demand forecast
router.post('/forecast', auth, async (req, res) => {
  try {
    const { warehouse_id, horizon_days = 30 } = req.body;
    if (!warehouse_id) return res.status(400).json({ error: 'warehouse_id required' });
    const cid = req.user.company_id;

    const inventory = await Inventory.find({ company_id: cid, warehouse_id, status: 'available' }).sort({ quantity: 1 }).limit(20).lean();
    const forecasts = [];

    for (const inv of inventory) {
      const avgDailyUsage = Math.max(0.1, inv.quantity / 30);
      const daysLeft = Math.floor(inv.quantity / avgDailyUsage);
      const riskLevel = daysLeft < 3 ? 'critical' : daysLeft < 7 ? 'high' : daysLeft < 14 ? 'medium' : 'low';

      const forecast = await WarehouseForecast.create({
        company_id: cid, warehouse_id,
        forecast_type: daysLeft < 14 ? 'stock_out' : 'replenishment',
        period_date: new Date(), horizon_days: Number(horizon_days),
        sku: inv.sku, product_name: inv.product_name,
        current_qty: inv.quantity,
        predicted_demand: Math.round(avgDailyUsage * horizon_days),
        reorder_point: Math.round(avgDailyUsage * 7),
        suggested_order_qty: Math.round(avgDailyUsage * 30),
        days_until_stockout: daysLeft,
        predicted_stockout_date: new Date(Date.now() + daysLeft * 86400000),
        avg_daily_consumption: avgDailyUsage,
        risk_level: riskLevel,
        recommended_action: daysLeft < 7 ? 'Immediate replenishment required' : 'Schedule replenishment',
        ai_explanation: `Based on current stock of ${inv.quantity} units and estimated daily usage of ${avgDailyUsage.toFixed(1)} units.`,
        confidence_score: 0.72,
      });
      forecasts.push(forecast);
    }

    res.json({ forecasts, count: forecasts.length, warehouse_id, horizon_days, generated_at: new Date() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/warehouse-ai/recommendations — list active recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    const { warehouse_id, priority, status = 'active', limit = 20 } = req.query;
    const q = { company_id: req.user.company_id, status };
    if (warehouse_id) q.warehouse_id = warehouse_id;
    if (priority) q.priority = priority;
    const recs = await WarehouseAIRecommendation.find(q).sort({ priority: 1, createdAt: -1 }).limit(Number(limit)).lean();
    const counts = await WarehouseAIRecommendation.aggregate([
      { $match: { company_id: req.user.company_id, ...(warehouse_id ? { warehouse_id: require('mongoose').Types.ObjectId.createFromHexString(warehouse_id) } : {}) } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);
    res.json({ recommendations: recs, total: recs.length, priority_counts: Object.fromEntries(counts.map(c => [c._id, c.count])) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/warehouse-ai/recommendations/:id/action
router.put('/recommendations/:id/action', auth, async (req, res) => {
  try {
    const rec = await WarehouseAIRecommendation.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { status: 'actioned', is_actioned: true, actioned_at: new Date(), actioned_by: req.user.name || req.user.username } },
      { new: true }
    );
    if (!rec) return res.status(404).json({ error: 'Not found' });
    res.json({ recommendation: rec, message: 'Recommendation actioned' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/warehouse-ai/heatmap — utilization heatmap data
router.get('/heatmap', auth, async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    if (!warehouse_id) return res.status(400).json({ error: 'warehouse_id required' });
    const zones = await WarehouseZone.find({ company_id: req.user.company_id, warehouse_id }).lean();
    const heatmap = await Promise.all(zones.map(async zone => {
      const total = await WarehouseBin.countDocuments({ zone_id: zone._id });
      const occupied = await WarehouseBin.countDocuments({ zone_id: zone._id, status: { $in: ['occupied', 'reserved'] } });
      const util = total > 0 ? Math.round((occupied / total) * 100) : 0;
      return { zone_id: zone._id, zone_code: zone.zone_code, zone_name: zone.zone_name, zone_type: zone.zone_type, total_bins: total, occupied_bins: occupied, utilization_pct: util, heat_level: util > 85 ? 'hot' : util > 60 ? 'warm' : util > 30 ? 'moderate' : 'cool' };
    }));
    res.json({ heatmap, warehouse_id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/warehouse-ai/labour-optimization
router.get('/labour-optimization', auth, async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    const q = { company_id: req.user.company_id, ...(warehouse_id ? { warehouse_id } : {}) };
    const [workers, pendingTasks] = await Promise.all([
      WarehouseWorker.find({ ...q, status: 'active' }).lean(),
      WarehouseTask.find({ ...q, status: { $in: ['pending', 'assigned'] } }).lean(),
    ]);
    const assignments = pendingTasks.map(task => {
      const worker = workers.find(w => w.role === task.task_type || (task.task_type === 'pick' && w.role === 'picker') || (task.task_type === 'receive' && w.role === 'receiver'));
      return { task_id: task._id, task_number: task.task_number, task_type: task.task_type, priority: task.priority, suggested_worker: worker ? worker.name : 'Unassigned', worker_id: worker?._id };
    });
    res.json({ workers: workers.length, pending_tasks: pendingTasks.length, suggested_assignments: assignments });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
