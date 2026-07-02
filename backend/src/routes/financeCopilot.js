const express         = require('express');
const router          = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Anthropic       = require('@anthropic-ai/sdk');
const Invoice         = require('../models/Invoice');
const Expense         = require('../models/Expense');
const CustomerPayment = require('../models/CustomerPayment');
const ProfitLoss      = require('../models/ProfitLoss');
const GSTReturn       = require('../models/GSTReturn');

const client = new Anthropic();
const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

async function getLiveContext(company_id) {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [revAgg, expAgg, outAgg, latestPL] = await Promise.all([
    Invoice.aggregate([
      { $match: { company_id, status: 'paid', invoice_date: { $gte: since30d } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    Expense.aggregate([
      { $match: { company_id, status: { $in: ['approved', 'paid'] }, expense_date: { $gte: since30d } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]),
    Invoice.aggregate([
      { $match: { company_id, status: 'issued' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),
    ProfitLoss.findOne({ company_id }).sort({ period_date: -1 })
  ]);

  return {
    revenue:     revAgg[0]?.total || 0,
    expenses:    expAgg[0]?.total || 0,
    outstanding: outAgg[0]?.total || 0,
    net_profit:  latestPL?.net_profit || 0
  };
}

// POST /chat
router.post('/chat', async (req, res) => {
  try {
    const { question, context: extraContext = '' } = req.body;
    if (!question) return err(res, 'question is required');

    const ctx = await getLiveContext(req.user.company_id);
    const systemPrompt = `You are an AI Finance Copilot for LocalWheels logistics company. Current financial snapshot:
Revenue (30d): ₹${ctx.revenue.toLocaleString('en-IN')}
Expenses (30d): ₹${ctx.expenses.toLocaleString('en-IN')}
Outstanding AR: ₹${ctx.outstanding.toLocaleString('en-IN')}
Net Profit: ₹${ctx.net_profit.toLocaleString('en-IN')}
${extraContext ? `\nAdditional context: ${extraContext}` : ''}

Answer the finance question concisely, accurately, and professionally.`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }]
    });

    return ok(res, {
      answer:  response.content[0].text,
      context: ctx
    });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /analyze
router.post('/analyze', async (req, res) => {
  try {
    const { analysis_type } = req.body;
    const validTypes = ['revenue', 'expenses', 'cashflow', 'risk', 'collections'];
    if (!validTypes.includes(analysis_type)) return err(res, `analysis_type must be one of: ${validTypes.join(', ')}`);

    const ctx       = await getLiveContext(req.user.company_id);
    const since30d  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    let contextData = {};
    let prompt      = '';

    if (analysis_type === 'revenue') {
      const byBranch = await Invoice.aggregate([
        { $match: { company_id: req.user.company_id, status: 'paid', invoice_date: { $gte: since30d } } },
        { $group: { _id: '$branch_id', total: { $sum: '$total' } } }
      ]);
      contextData = { revenue_30d: ctx.revenue, by_branch: byBranch };
      prompt = `Analyze the revenue performance for a logistics company with ₹${ctx.revenue} in the last 30 days. Branch breakdown: ${JSON.stringify(byBranch)}. Provide insights, trends, and growth recommendations.`;

    } else if (analysis_type === 'expenses') {
      const byCategory = await Expense.aggregate([
        { $match: { company_id: req.user.company_id, expense_date: { $gte: since30d } } },
        { $group: { _id: '$category', total: { $sum: '$total_amount' } } }
      ]);
      contextData = { expenses_30d: ctx.expenses, by_category: byCategory };
      prompt = `Analyze expense structure for a logistics company with ₹${ctx.expenses} expenses in the last 30 days. Category breakdown: ${JSON.stringify(byCategory)}. Identify cost optimization opportunities.`;

    } else if (analysis_type === 'cashflow') {
      contextData = { revenue: ctx.revenue, expenses: ctx.expenses, outstanding: ctx.outstanding };
      prompt = `Analyze cashflow for a logistics company: Revenue ₹${ctx.revenue}, Expenses ₹${ctx.expenses}, Outstanding AR ₹${ctx.outstanding}. Assess liquidity and provide cash management recommendations.`;

    } else if (analysis_type === 'risk') {
      const overdueCount = await Invoice.countDocuments({ company_id: req.user.company_id, status: 'overdue' });
      const pendingGST   = await GSTReturn.countDocuments({ company_id: req.user.company_id, status: { $ne: 'filed' } });
      contextData = { outstanding: ctx.outstanding, overdue_invoices: overdueCount, pending_gst_filings: pendingGST };
      prompt = `Assess financial risks for a logistics company: Outstanding AR ₹${ctx.outstanding}, Overdue invoices: ${overdueCount}, Pending GST filings: ${pendingGST}. Identify key risks and mitigation strategies.`;

    } else if (analysis_type === 'collections') {
      const topCustomers = await CustomerPayment.aggregate([
        { $match: { company_id: req.user.company_id } },
        { $group: { _id: '$customer_id', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 5 }
      ]);
      contextData = { outstanding: ctx.outstanding, top_customers: topCustomers };
      prompt = `Analyze collections performance for a logistics company: Total outstanding ₹${ctx.outstanding}. Top customers by payments: ${JSON.stringify(topCustomers)}. Recommend collection improvement strategies.`;
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: 'You are an expert financial analyst for a logistics company. Provide structured analysis with clear recommendations and risks. Be concise and actionable.',
      messages: [{ role: 'user', content: prompt }]
    });

    const rawText = response.content[0].text;

    // Extract a few recommendations and risks from the narrative
    const lines           = rawText.split('\n').filter(l => l.trim());
    const recommendations = lines.filter(l => /recommend|suggest|should|improve|consider/i.test(l)).slice(0, 3);
    const risks           = lines.filter(l => /risk|concern|warning|overdue|danger|issue/i.test(l)).slice(0, 3);

    return ok(res, { analysis: rawText, recommendations, risks, context: contextData });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /forecast
router.post('/forecast', async (req, res) => {
  try {
    const { metric = 'revenue', months = 3 } = req.body;
    const cid = req.user.company_id;

    // Build last 6 months of trend data
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date();
      start.setDate(1);
      start.setMonth(start.getMonth() - i);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
      const label = start.toLocaleString('default', { month: 'short', year: 'numeric' });

      let amount = 0;
      if (metric === 'revenue') {
        const agg = await Invoice.aggregate([
          { $match: { company_id: cid, status: 'paid', invoice_date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        amount = agg[0]?.total || 0;
      } else {
        const agg = await Expense.aggregate([
          { $match: { company_id: cid, expense_date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$total_amount' } } }
        ]);
        amount = agg[0]?.total || 0;
      }
      trendData.push({ month: label, amount });
    }

    const prompt = `You are a financial forecasting AI for a logistics company.
Historical ${metric} data (last 6 months in INR):
${trendData.map(d => `${d.month}: ₹${d.amount}`).join('\n')}

Forecast the next ${months} months of ${metric}.

Respond ONLY with valid JSON (no markdown):
{
  "forecast": [
    {"month": "Aug 2025", "amount": 150000}
  ],
  "confidence_pct": 75,
  "methodology": "brief description of forecasting method used"
}`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }]
    });

    let result;
    try {
      result = JSON.parse(response.content[0].text);
    } catch {
      result = { forecast: [], confidence_pct: 0, methodology: response.content[0].text };
    }

    return ok(res, { ...result, historical: trendData });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
