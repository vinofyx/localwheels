const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Budget = require('../models/Budget');
const BudgetLine = require('../models/BudgetLine');
const Expense = require('../models/Expense');

const ok = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

// GET /vs-actual — before /:id
router.get('/vs-actual', async (req, res) => {
  try {
    const company_id = req.user.company_id;

    const activeBudgets = await Budget.find({ company_id, status: 'active' });
    if (!activeBudgets.length) return ok(res, []);

    const budgetIds = activeBudgets.map(b => b._id);
    const lines = await BudgetLine.find({ company_id, budget_id: { $in: budgetIds } });

    // Aggregate actual expenses by category
    const expenseAgg = await Expense.aggregate([
      { $match: { company_id } },
      { $group: { _id: '$category', actual: { $sum: '$total_amount' } } },
    ]);
    const actualByCategory = {};
    expenseAgg.forEach(e => { actualByCategory[e._id] = e.actual; });

    const result = lines.map(line => {
      const actual_amount = actualByCategory[line.category] || 0;
      const variance = line.budget_amount - actual_amount;
      const variance_pct = line.budget_amount ? (variance / line.budget_amount) * 100 : 0;
      return {
        budget_id: line.budget_id,
        category: line.category,
        budget_amount: line.budget_amount,
        actual_amount,
        variance: Math.round(variance * 100) / 100,
        variance_pct: Math.round(variance_pct * 100) / 100,
      };
    });
    return ok(res, result);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// GET / — list Budget
router.get('/', async (req, res) => {
  try {
    const { financial_year, status } = req.query;
    const query = { company_id: req.user.company_id };
    if (financial_year) query.financial_year = financial_year;
    if (status) query.status = status;
    const data = await Budget.find(query).sort({ created_at: -1 });
    return ok(res, data);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// POST / — create Budget
router.post('/', async (req, res) => {
  try {
    const { budget_name, financial_year, period_type, total_revenue_budget, total_expense_budget, notes } = req.body;
    const budget = await Budget.create({
      company_id: req.user.company_id,
      budget_name,
      financial_year,
      period_type,
      total_revenue_budget,
      total_expense_budget,
      notes,
      status: 'draft',
      created_by: req.user.id,
    });
    return ok(res, budget, 'Budget created', 201);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// GET /:id — get Budget with BudgetLines
router.get('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!budget) return err(res, 'Not found', 404);
    const lines = await BudgetLine.find({ budget_id: req.params.id, company_id: req.user.company_id });
    return ok(res, { budget, lines });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// PUT /:id/approve
router.put('/:id/approve', async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { status: 'active', approved_by: req.user.id, approved_at: new Date() },
      { new: true }
    );
    if (!budget) return err(res, 'Not found', 404);
    return ok(res, budget, 'Budget approved and activated');
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// POST /:id/lines — create BudgetLine
router.post('/:id/lines', async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!budget) return err(res, 'Budget not found', 404);
    const line = await BudgetLine.create({
      ...req.body,
      budget_id: req.params.id,
      company_id: req.user.company_id,
      actual_amount: req.body.actual_amount || 0,
      variance: (req.body.budget_amount || 0) - (req.body.actual_amount || 0),
      created_by: req.user.id,
    });
    return ok(res, line, 'Budget line created', 201);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// GET /:id/lines — list BudgetLines with variance
router.get('/:id/lines', async (req, res) => {
  try {
    const lines = await BudgetLine.find({ budget_id: req.params.id, company_id: req.user.company_id });
    const data = lines.map(l => ({
      ...l.toObject(),
      variance: (l.budget_amount || 0) - (l.actual_amount || 0),
    }));
    return ok(res, data);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// PUT /:id/lines/:line_id/actual — update actual_amount
router.put('/:id/lines/:line_id/actual', async (req, res) => {
  try {
    const { actual_amount } = req.body;
    const line = await BudgetLine.findOne({ _id: req.params.line_id, budget_id: req.params.id, company_id: req.user.company_id });
    if (!line) return err(res, 'Budget line not found', 404);

    line.actual_amount = parseFloat(actual_amount) || 0;
    line.variance = (line.budget_amount || 0) - line.actual_amount;
    line.variance_pct = line.budget_amount
      ? Math.round(((line.variance / line.budget_amount) * 100) * 100) / 100
      : 0;
    await line.save();
    return ok(res, line, 'Actual updated');
  } catch (e) {
    return err(res, e.message, 500);
  }
});

module.exports = router;
