const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const CashFlow = require('../models/CashFlow');

const ok = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

// GET /dashboard — before /:id
router.get('/dashboard', async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const records = await CashFlow.find({ company_id }).sort({ period_date: -1 }).limit(12);

    const currentMonth = records.find(r => {
      const d = new Date(r.period_date);
      return d >= currentMonthStart && d <= currentMonthEnd;
    }) || null;

    const last6 = records.slice(0, 6).map(r => ({
      period_label: r.period,
      net_flow: r.net_flow || 0,
    })).reverse();

    // Forecast: average of last 3 months
    const last3 = records.slice(0, 3);
    const avgInflow = last3.length
      ? last3.reduce((s, r) => s + (r.inflows?.total || 0), 0) / last3.length
      : 0;
    const avgOutflow = last3.length
      ? last3.reduce((s, r) => s + (r.outflows?.total || 0), 0) / last3.length
      : 0;

    return ok(res, {
      current_month: currentMonth
        ? {
            inflows_total: currentMonth.inflows?.total || 0,
            outflows_total: currentMonth.outflows?.total || 0,
            net_flow: currentMonth.net_flow || 0,
            opening: currentMonth.opening_balance || 0,
            closing: currentMonth.closing_balance || 0,
          }
        : null,
      last_6_months: last6,
      forecast_next_month: {
        estimated_inflow: Math.round(avgInflow * 100) / 100,
        estimated_outflow: Math.round(avgOutflow * 100) / 100,
      },
    });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// GET /forecast
router.get('/forecast', async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const records = await CashFlow.find({ company_id }).sort({ period_date: -1 }).limit(6);

    if (records.length === 0) return ok(res, []);

    const avgInflow = records.reduce((s, r) => s + (r.inflows?.total || 0), 0) / records.length;
    const avgOutflow = records.reduce((s, r) => s + (r.outflows?.total || 0), 0) / records.length;

    const forecasts = [];
    const lastDate = new Date(records[0].period_date);
    for (let i = 1; i <= 3; i++) {
      const d = new Date(lastDate);
      d.setMonth(d.getMonth() + i);
      const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      forecasts.push({
        period_label: label,
        forecast_inflow: Math.round(avgInflow * 100) / 100,
        forecast_outflow: Math.round(avgOutflow * 100) / 100,
        forecast_net: Math.round((avgInflow - avgOutflow) * 100) / 100,
      });
    }
    return ok(res, forecasts);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// GET / — list CashFlow
router.get('/', async (req, res) => {
  try {
    const { period } = req.query;
    const query = { company_id: req.user.company_id };
    if (period) query.period = period;
    const data = await CashFlow.find(query).sort({ period_date: -1 }).limit(12);
    return ok(res, data);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// POST /snapshot — create or upsert CashFlow
router.post('/snapshot', async (req, res) => {
  try {
    const { period, period_date, opening_balance = 0, inflows = {}, outflows = {} } = req.body;
    const company_id = req.user.company_id;
    const inflows_total = parseFloat(inflows.total) || 0;
    const outflows_total = parseFloat(outflows.total) || 0;
    const net_flow = inflows_total - outflows_total;
    const closing_balance = parseFloat(opening_balance) + net_flow;

    const snapshot = await CashFlow.findOneAndUpdate(
      { company_id, period },
      {
        company_id,
        period,
        period_date,
        opening_balance: parseFloat(opening_balance),
        inflows: { ...inflows, total: inflows_total },
        outflows: { ...outflows, total: outflows_total },
        net_flow,
        closing_balance,
        updated_by: req.user.id,
      },
      { upsert: true, new: true }
    );
    return ok(res, snapshot, 'Cash flow snapshot saved', 201);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

module.exports = router;
