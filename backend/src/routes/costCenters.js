const express    = require('express');
const router     = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const CostCenter = require('../models/CostCenter');
const Expense    = require('../models/Expense');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

// GET / — list all CostCenters for company
router.get('/', async (req, res) => {
  try {
    const filter = { company_id: req.user.company_id };
    if (req.query.is_active !== undefined) filter.is_active = req.query.is_active === 'true';
    const centers = await CostCenter.find(filter).sort({ code: 1 });
    return ok(res, centers);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /summary — budget vs actual per cost center
router.get('/summary', async (req, res) => {
  try {
    const centers = await CostCenter.find({ company_id: req.user.company_id, is_active: true });
    const summary = await Promise.all(centers.map(async (c) => {
      const agg = await Expense.aggregate([
        { $match: { company_id: req.user.company_id, cost_center_id: c._id, status: { $in: ['approved', 'paid'] } } },
        { $group: { _id: null, actual: { $sum: '$total_amount' } } }
      ]);
      const actual_amount = agg[0]?.actual || 0;
      const budget_amount = c.budget_amount || 0;
      const variance      = budget_amount - actual_amount;
      const variance_pct  = budget_amount ? ((variance / budget_amount) * 100).toFixed(2) : 0;
      return { code: c.code, name: c.name, budget_amount, actual_amount, variance, variance_pct };
    }));
    return ok(res, summary);
  } catch (e) { return err(res, e.message, 500); }
});

// POST / — create
router.post('/', async (req, res) => {
  try {
    const { code, name, type, parent_id, manager_id, budget_amount, description, branch_id } = req.body;
    const center = await CostCenter.create({
      company_id: req.user.company_id,
      code, name, type, parent_id, manager_id, budget_amount, description, branch_id,
      is_active: true
    });
    return ok(res, center, 'Cost center created', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /:id — single with expense total
router.get('/:id', async (req, res) => {
  try {
    const center = await CostCenter.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!center) return err(res, 'Not found', 404);
    const agg = await Expense.aggregate([
      { $match: { company_id: req.user.company_id, cost_center_id: center._id } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } }
    ]);
    return ok(res, { ...center.toObject(), expense_total: agg[0]?.total || 0 });
  } catch (e) { return err(res, e.message, 500); }
});

// PUT /:id — update
router.put('/:id', async (req, res) => {
  try {
    const center = await CostCenter.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: req.body },
      { new: true }
    );
    if (!center) return err(res, 'Not found', 404);
    return ok(res, center, 'Updated');
  } catch (e) { return err(res, e.message, 500); }
});

// DELETE /:id — soft delete
router.delete('/:id', async (req, res) => {
  try {
    const center = await CostCenter.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { is_active: false } },
      { new: true }
    );
    if (!center) return err(res, 'Not found', 404);
    return ok(res, center, 'Deactivated');
  } catch (e) { return err(res, e.message, 500); }
});

// GET /:id/expenses — last 50 expenses for a cost center
router.get('/:id/expenses', async (req, res) => {
  try {
    const center = await CostCenter.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!center) return err(res, 'Not found', 404);
    const expenses = await Expense.find({ company_id: req.user.company_id, cost_center_id: center._id })
      .sort({ createdAt: -1 })
      .limit(50);
    return ok(res, expenses);
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
