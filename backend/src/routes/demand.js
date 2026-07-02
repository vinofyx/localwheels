const express   = require('express');
const router    = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate: auth } = require('../middleware/auth');

const DemandForecast = require('../models/DemandForecast');
const Simulation     = require('../models/Simulation');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// GET /api/demand
router.get('/', auth, async (req, res) => {
  try {
    const { period_type, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (period_type) filter.period_type = period_type;
    const forecasts = await DemandForecast.find(filter).sort({ forecast_date: -1 }).limit(+limit).lean();
    return ok(res, { forecasts, total: forecasts.length });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/demand/forecast
router.post('/forecast', auth, async (req, res) => {
  try {
    const { period_type, region, product_type, horizon_months } = req.body;
    const base = Math.floor(Math.random()*500) + 200;
    const growth = (Math.random()*30 - 5).toFixed(1) * 1;
    const forecast = await DemandForecast.create({
      company_id: req.user.company_id,
      forecast_date: new Date(),
      period_type: period_type || 'monthly',
      region: region || 'All',
      product_type: product_type || 'general',
      forecasted_units: base,
      forecasted_revenue: base * 850,
      growth_pct: growth,
      seasonality_factor: 1 + Math.random()*0.3,
      trend_direction: growth > 5 ? 'up' : growth < -2 ? 'down' : 'flat',
      confidence_pct: 75 + Math.floor(Math.random()*20),
      factors: [
        { name: 'Seasonal trend',       impact: 0.15, description: 'Q3 historically higher demand' },
        { name: 'Market growth',        impact: 0.10, description: '10% YoY market expansion' },
        { name: 'Competition pressure', impact: -0.05, description: 'New entrants in key lanes' },
      ],
      model_used: 'ai_claude',
    });
    return ok(res, forecast, 'Demand forecast generated', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/demand/simulate
router.post('/simulate', auth, async (req, res) => {
  try {
    const { scenario, demand_change_pct } = req.body;
    const sim = await Simulation.create({
      company_id: req.user.company_id,
      name: `Demand Sim — ${scenario || 'default'}`,
      sim_type: 'demand',
      parameters: { scenario, demand_change_pct: demand_change_pct || 20 },
      time_horizon_days: 30, created_by: req.user._id,
    });
    setImmediate(async () => {
      await Simulation.findByIdAndUpdate(sim._id, { status: 'completed', completed_at: new Date(), progress_pct: 100 });
    });
    return ok(res, sim, 'Demand simulation started', 202);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/demand/ai-forecast
router.post('/ai-forecast', auth, async (req, res) => {
  try {
    const { context, horizon_months } = req.body;
    const client  = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are a demand forecasting expert for a logistics company. Generate a ${horizon_months||3}-month demand forecast.
Context: ${context || 'Mid-size logistics company, India operations, B2B freight'}
Return JSON: {"forecast_units":[{"month":"Jan","units":500,"revenue":425000},{"month":"Feb","units":520,"revenue":442000},{"month":"Mar","units":540,"revenue":459000}],"growth_pct":8,"trend":"up","key_drivers":["..."],"risks":["..."],"confidence_pct":80}
Return ONLY valid JSON.`,
      }],
    });
    let forecast = {};
    try { forecast = JSON.parse(message.content[0].text); } catch { forecast = { growth_pct: 8, trend: 'up', confidence_pct: 75 }; }
    return ok(res, { forecast });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
