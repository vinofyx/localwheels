const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');
const Shipment = require('../models/Shipment');
const Forecast = require('../models/Forecast');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const { cacheGet, cacheSet } = require('../middleware/cache');
const _fmem = new Map();
const fmGet = (k) => { const e = _fmem.get(k); return e && e.exp > Date.now() ? e.v : null; };
const fmSet = (k, v, s) => { _fmem.set(k, { v, exp: Date.now() + s * 1000 }); };

// Build 6-month revenue history for forecasting
async function getMonthlyHistory(company_id, months = 6) {
  const results = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1); d.setHours(0,0,0,0);
    d.setMonth(d.getMonth() - i);
    const end = new Date(d); end.setMonth(end.getMonth() + 1);
    const agg = await Shipment.aggregate([
      { $match: { company_id, createdAt: { $gte: d, $lt: end } } },
      { $group: { _id: null, revenue: { $sum: '$freight_charges' }, count: { $sum: 1 } } },
    ]).catch(() => []);
    results.push({
      month: d.toISOString().slice(0, 7),
      revenue: agg[0]?.revenue || 0,
      shipments: agg[0]?.count || 0,
    });
  }
  return results;
}

function linearTrend(values) {
  const n = values.length;
  if (n < 2) return values[values.length - 1] || 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  values.forEach((y, x) => { num += (x - xMean) * (y - yMean); den += (x - xMean) ** 2; });
  const slope = den !== 0 ? num / den : 0;
  return Math.max(0, yMean + slope * (n - xMean));
}

// GET /api/forecast/revenue — revenue forecast
router.get('/revenue', auth, async (req, res) => {
  try {
    // Cache revenue forecast for 1 hour — AI call + 6-month aggregation is expensive
    const cacheKey = `forecast_rev:${req.user.company_id}`;
    const cached = (await cacheGet(cacheKey)) || fmGet(cacheKey);
    if (cached) return res.json({ ...cached, _cached: true });

    const history = await getMonthlyHistory(req.user.company_id, 6);
    const revenues = history.map(h => h.revenue);
    const predicted = Math.round(linearTrend(revenues));
    const last = revenues[revenues.length - 1] || 0;
    const trend = predicted > last * 1.05 ? 'up' : predicted < last * 0.95 ? 'down' : 'stable';
    const change_pct = last > 0 ? (((predicted - last) / last) * 100).toFixed(1) : 0;

    let aiExplanation = '';
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Monthly revenue trend (last 6 months): ${revenues.map(v => '₹'+v.toLocaleString()).join(', ')}. Predicted next month: ₹${predicted.toLocaleString()}. Give a 1-sentence business explanation.`,
        }],
      });
      aiExplanation = msg.content[0]?.text || '';
    } catch (_) {
      aiExplanation = `Based on historical trend, revenue is projected to be ₹${predicted.toLocaleString()} next month.`;
    }

    const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1); nextMonth.setDate(1);
    await Forecast.findOneAndUpdate(
      { company_id: req.user.company_id, forecast_type: 'revenue', forecast_date: nextMonth },
      {
        company_id: req.user.company_id,
        forecast_type: 'revenue',
        period: 'monthly',
        forecast_date: nextMonth,
        predicted_value: predicted,
        confidence: 0.75,
        lower_bound: Math.round(predicted * 0.85),
        upper_bound: Math.round(predicted * 1.15),
        trend,
        change_pct: parseFloat(change_pct),
        basis: aiExplanation,
        data_points: history,
      },
      { upsert: true, new: true }
    );

    const payload = { status: true, message: 'OK', data: { history, predicted, trend, change_pct, ai_explanation: aiExplanation, lower_bound: Math.round(predicted * 0.85), upper_bound: Math.round(predicted * 1.15) } };
    // Cache for 1 hour — forecast changes slowly
    await cacheSet(cacheKey, payload, 3600);
    fmSet(cacheKey, payload, 3600);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/forecast/shipments — shipment volume forecast
router.get('/shipments', auth, async (req, res) => {
  try {
    const history = await getMonthlyHistory(req.user.company_id, 6);
    const counts = history.map(h => h.shipments);
    const predicted = Math.round(linearTrend(counts));
    const last = counts[counts.length - 1] || 0;
    const trend = predicted > last * 1.05 ? 'up' : predicted < last * 0.95 ? 'down' : 'stable';

    res.json({ history, predicted, trend, lower_bound: Math.round(predicted * 0.9), upper_bound: Math.round(predicted * 1.1) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/forecast/all — all forecast types
router.get('/all', auth, async (req, res) => {
  try {
    const history = await getMonthlyHistory(req.user.company_id, 6);
    const revenues = history.map(h => h.revenue);
    const counts = history.map(h => h.shipments);

    const revPredicted = Math.round(linearTrend(revenues));
    const shipPredicted = Math.round(linearTrend(counts));
    const lastRev = revenues[revenues.length - 1] || 0;
    const lastShip = counts[counts.length - 1] || 0;

    res.json({
      revenue: {
        predicted: revPredicted,
        trend: revPredicted > lastRev * 1.05 ? 'up' : revPredicted < lastRev * 0.95 ? 'down' : 'stable',
        change_pct: lastRev > 0 ? (((revPredicted - lastRev) / lastRev) * 100).toFixed(1) : 0,
        history: revenues,
      },
      shipments: {
        predicted: shipPredicted,
        trend: shipPredicted > lastShip * 1.05 ? 'up' : shipPredicted < lastShip * 0.95 ? 'down' : 'stable',
        change_pct: lastShip > 0 ? (((shipPredicted - lastShip) / lastShip) * 100).toFixed(1) : 0,
        history: counts,
      },
      months: history.map(h => h.month),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/forecast/history — past forecasts vs actuals
router.get('/history', auth, async (req, res) => {
  try {
    const records = await Forecast.find({ company_id: req.user.company_id }).sort({ forecast_date: -1 }).limit(20);
    res.json({ forecasts: records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
