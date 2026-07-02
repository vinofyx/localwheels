const express           = require('express');
const router            = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const FinancialForecast = require('../models/FinancialForecast');
const ProfitLoss        = require('../models/ProfitLoss');
const CashFlow          = require('../models/CashFlow');
const Anthropic         = require('@anthropic-ai/sdk');

const client = new Anthropic();
const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

// GET / — list forecasts
router.get('/', async (req, res) => {
  try {
    const forecasts = await FinancialForecast.find({ company_id: req.user.company_id })
      .sort({ createdAt: -1 });
    return ok(res, forecasts);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [recent_forecasts, all_forecasts] = await Promise.all([
      FinancialForecast.find({ company_id: req.user.company_id }).sort({ createdAt: -1 }).limit(5),
      FinancialForecast.find({ company_id: req.user.company_id, status: 'active' })
    ]);
    const accuracy_avg = all_forecasts.length
      ? (all_forecasts.reduce((s, f) => s + (f.accuracy_pct || 0), 0) / all_forecasts.length).toFixed(2)
      : 0;
    return ok(res, { recent_forecasts, accuracy_avg: parseFloat(accuracy_avg), active_count: all_forecasts.length });
  } catch (e) { return err(res, e.message, 500); }
});

// POST / — create forecast
router.post('/', async (req, res) => {
  try {
    const { forecast_name, forecast_type, period, start_date, end_date, data_points } = req.body;
    const forecast = await FinancialForecast.create({
      company_id: req.user.company_id,
      forecast_name, forecast_type, period, start_date, end_date, data_points
    });
    return ok(res, forecast, 'Forecast created', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /ai-forecast — AI-generated forecast via Claude
router.post('/ai-forecast', async (req, res) => {
  try {
    const { forecast_type = 'revenue', periods = 6, context = '' } = req.body;

    const prompt = `You are a financial analyst AI. Generate a detailed ${forecast_type} forecast for the next ${periods} periods for a logistics company.
${context ? `Additional context: ${context}` : ''}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "data_points": [
    {"period_label": "Month 1", "forecast_amount": 100000},
    {"period_label": "Month 2", "forecast_amount": 110000}
  ],
  "key_assumptions": ["assumption 1", "assumption 2"],
  "risks": ["risk 1", "risk 2"]
}

Generate exactly ${periods} data_points. Use realistic amounts in INR for a logistics company.`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    let result;
    try {
      result = JSON.parse(response.content[0].text);
    } catch {
      result = { data_points: [], key_assumptions: [], risks: [], raw: response.content[0].text };
    }

    return ok(res, result, 'AI forecast generated');
  } catch (e) { return err(res, e.message, 500); }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const forecast = await FinancialForecast.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!forecast) return err(res, 'Not found', 404);
    return ok(res, forecast);
  } catch (e) { return err(res, e.message, 500); }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const forecast = await FinancialForecast.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: req.body },
      { new: true }
    );
    if (!forecast) return err(res, 'Not found', 404);
    return ok(res, forecast, 'Updated');
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
