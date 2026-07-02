const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');

const ok = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

// GET /stats — before /:id
router.get('/stats', async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const [total_submitted, total_approved, amountAgg, by_category] = await Promise.all([
      Expense.countDocuments({ company_id, status: 'submitted' }),
      Expense.countDocuments({ company_id, status: 'approved' }),
      Expense.aggregate([
        { $match: { company_id } },
        { $group: { _id: null, total: { $sum: '$total_amount' } } },
      ]),
      Expense.aggregate([
        { $match: { company_id } },
        { $group: { _id: '$category', amount: { $sum: '$total_amount' } } },
        { $sort: { amount: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, category: '$_id', amount: 1 } },
      ]),
    ]);
    const total_amount = amountAgg[0]?.total || 0;
    return ok(res, { total_submitted, total_approved, total_amount, by_category });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// GET /categories
router.get('/categories', async (req, res) => {
  try {
    const data = await ExpenseCategory.find({ company_id: req.user.company_id }).sort({ name: 1 });
    return ok(res, data);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// POST /categories
router.post('/categories', async (req, res) => {
  try {
    const category = await ExpenseCategory.create({ ...req.body, company_id: req.user.company_id });
    return ok(res, category, 'Category created', 201);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// GET / — list Expense
router.get('/', async (req, res) => {
  try {
    const { status, category, date_from, date_to, page = 1 } = req.query;
    const query = { company_id: req.user.company_id };
    if (status) query.status = status;
    if (category) query.category = category;
    if (date_from || date_to) {
      query.expense_date = {};
      if (date_from) query.expense_date.$gte = new Date(date_from);
      if (date_to) query.expense_date.$lte = new Date(date_to);
    }
    const limit = 50;
    const skip = (parseInt(page) - 1) * limit;
    const [data, total] = await Promise.all([
      Expense.find(query).sort({ expense_date: -1 }).skip(skip).limit(limit),
      Expense.countDocuments(query),
    ]);
    return ok(res, { data, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// POST / — create Expense
router.post('/', async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const count = await Expense.countDocuments({ company_id });
    const seq = String(count + 1).padStart(4, '0');
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
    const expense_no = `EXP-${datePart}-${seq}`;
    const { amount = 0, tax_amount = 0 } = req.body;
    const total_amount = parseFloat(amount) + parseFloat(tax_amount);
    const expense = await Expense.create({
      ...req.body,
      company_id,
      expense_no,
      total_amount,
      status: req.body.status || 'draft',
      created_by: req.user.id,
    });
    return ok(res, expense, 'Expense created', 201);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!expense) return err(res, 'Not found', 404);
    return ok(res, expense);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// PUT /:id/approve
router.put('/:id/approve', async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { status: 'approved', approved_by: req.user.id, approved_at: new Date() },
      { new: true }
    );
    if (!expense) return err(res, 'Not found', 404);
    return ok(res, expense, 'Expense approved');
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// PUT /:id/reject
router.put('/:id/reject', async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { status: 'rejected' },
      { new: true }
    );
    if (!expense) return err(res, 'Not found', 404);
    return ok(res, expense, 'Expense rejected');
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// PUT /:id/pay
router.put('/:id/pay', async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { status: 'paid', paid_date: new Date() },
      { new: true }
    );
    if (!expense) return err(res, 'Not found', 404);
    return ok(res, expense, 'Expense marked as paid');
  } catch (e) {
    return err(res, e.message, 500);
  }
});

module.exports = router;
