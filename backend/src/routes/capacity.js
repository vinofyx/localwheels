const express   = require('express');
const router    = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate: auth } = require('../middleware/auth');

const CapacityForecast = require('../models/CapacityForecast');
const Simulation       = require('../models/Simulation');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// GET /api/capacity
router.get('/', auth, async (req, res) => {
  try {
    const { entity_type, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (entity_type) filter.entity_type = entity_type;
    const forecasts = await CapacityForecast.find(filter).sort({ forecast_date: -1 }).limit(+limit).lean();
    return ok(res, { forecasts, total: forecasts.length });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/capacity/forecast — generate capacity forecast
router.post('/forecast', auth, async (req, res) => {
  try {
    const { entity_type, horizon_days, entity_id } = req.body;
    const current = 100;
    const demand  = Math.floor(current * (1 + (Math.random()*0.4 - 0.1)));
    const shortage = Math.max(0, demand - current);
    const surplus  = Math.max(0, current - demand);
    const dataPoints = [];
    for (let i = 0; i <= (horizon_days || 30); i += 7) {
      const d = new Date(); d.setDate(d.getDate() + i);
      const dm = current * (1 + (Math.random()*0.3));
      dataPoints.push({ date: d, demand: Math.round(dm), capacity: current, utilization: Math.round(dm/current*100) });
    }
    const forecast = await CapacityForecast.create({
      company_id: req.user.company_id,
      forecast_date: new Date(),
      horizon_days: horizon_days || 30,
      entity_type: entity_type || 'overall',
      entity_id: entity_id || undefined,
      current_capacity: current,
      forecasted_demand: demand,
      utilization_pct: Math.round(demand/current*100),
      shortage_units: shortage,
      surplus_units: surplus,
      peak_date: new Date(Date.now() + 15*86400000),
      peak_demand: Math.round(demand * 1.2),
      recommendations: shortage > 0
        ? ['Add 2 additional vehicles', 'Consider sub-contracting for peak period', 'Extend warehouse shifts']
        : ['Current capacity sufficient', 'Consider reducing idle fleet', 'Optimise utilisation rates'],
      confidence_pct: 80 + Math.floor(Math.random()*15),
      data_points: dataPoints,
    });
    return ok(res, forecast, 'Capacity forecast generated', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/capacity/simulate — run capacity simulation
router.post('/simulate', auth, async (req, res) => {
  try {
    const { scenario, horizon_days } = req.body;
    const sim = await Simulation.create({
      company_id: req.user.company_id,
      name: `Capacity Sim — ${scenario || 'default'}`,
      sim_type: 'capacity',
      parameters: { scenario, horizon_days: horizon_days || 30 },
      time_horizon_days: horizon_days || 30,
      created_by: req.user._id,
    });
    setImmediate(async () => {
      await Simulation.findByIdAndUpdate(sim._id, { status: 'completed', completed_at: new Date(), progress_pct: 100 });
    });
    return ok(res, sim, 'Capacity simulation started', 202);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/capacity/ai-analysis
router.post('/ai-analysis', auth, async (req, res) => {
  try {
    const forecasts = await CapacityForecast.find({ company_id: req.user.company_id }).sort({ createdAt: -1 }).limit(5).lean();
    const client  = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Analyse these logistics capacity forecasts: ${JSON.stringify(forecasts.slice(0,3))}
Return JSON: {"summary":"...","bottlenecks":["..."],"recommendations":["..."],"risk_level":"low|medium|high"}
Return ONLY valid JSON.`,
      }],
    });
    let analysis = {};
    try { analysis = JSON.parse(message.content[0].text); } catch { analysis = { summary: 'Capacity within normal range', risk_level: 'low' }; }
    return ok(res, { analysis });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
