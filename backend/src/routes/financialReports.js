const express         = require('express');
const router          = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const ProfitLoss      = require('../models/ProfitLoss');
const TrialBalance    = require('../models/TrialBalance');
const CashFlow        = require('../models/CashFlow');
const Invoice         = require('../models/Invoice');
const Expense         = require('../models/Expense');
const CustomerPayment = require('../models/CustomerPayment');
const VendorPayment   = require('../models/VendorPayment');
const ChartOfAccount  = require('../models/ChartOfAccount');
const GeneralLedger   = require('../models/GeneralLedger');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

// GET /profit-loss
router.get('/profit-loss', async (req, res) => {
  try {
    const { period, financial_year } = req.query;
    const filter = { company_id: req.user.company_id };
    if (period)         filter.period = period;
    if (financial_year) filter.financial_year = financial_year;
    const records = await ProfitLoss.find(filter).sort({ period_date: -1 });
    return ok(res, records);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /profit-loss/generate
router.post('/profit-loss/generate', async (req, res) => {
  try {
    const { period, period_date, financial_year, branch_id } = req.body;
    const start = new Date(period_date);
    start.setDate(1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);

    const invoiceFilter = {
      company_id: req.user.company_id,
      status: 'paid',
      invoice_date: { $gte: start, $lte: end }
    };
    if (branch_id) invoiceFilter.branch_id = branch_id;

    const expenseFilter = {
      company_id: req.user.company_id,
      status: { $in: ['approved', 'paid'] },
      expense_date: { $gte: start, $lte: end }
    };
    if (branch_id) expenseFilter.branch_id = branch_id;

    const [invAgg, expAgg] = await Promise.all([
      Invoice.aggregate([
        { $match: invoiceFilter },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Expense.aggregate([
        { $match: expenseFilter },
        { $group: { _id: null, total: { $sum: '$total_amount' } } }
      ])
    ]);

    const logistics_income = invAgg[0]?.total || 0;
    const other_expense    = expAgg[0]?.total || 0;
    const total_revenue    = logistics_income;
    const total_expenses   = other_expense;
    const gross_profit     = total_revenue - total_expenses;
    const net_profit       = gross_profit;

    const doc = await ProfitLoss.findOneAndUpdate(
      { company_id: req.user.company_id, period, financial_year },
      {
        $set: {
          company_id: req.user.company_id,
          period, period_date, financial_year, branch_id,
          revenue:   { logistics_income, total: total_revenue },
          expenses:  { other_expense, total: total_expenses },
          gross_profit, net_profit
        }
      },
      { upsert: true, new: true }
    );
    return ok(res, doc, 'Profit & Loss generated', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /trial-balance/latest
router.get('/trial-balance/latest', async (req, res) => {
  try {
    const tb = await TrialBalance.findOne({ company_id: req.user.company_id }).sort({ period_date: -1 });
    if (!tb) return err(res, 'No trial balance found', 404);
    return ok(res, tb);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /trial-balance/generate
router.post('/trial-balance/generate', async (req, res) => {
  try {
    const { period_date, financial_year } = req.body;
    const accounts = await ChartOfAccount.find({ company_id: req.user.company_id, is_active: true });

    const lines = accounts.map((a) => ({
      account_code: a.code,
      account_name: a.name,
      account_type: a.type,
      debit:  a.current_balance > 0 ? a.current_balance : 0,
      credit: a.current_balance < 0 ? Math.abs(a.current_balance) : 0
    }));

    const total_debit  = lines.reduce((s, l) => s + l.debit,  0);
    const total_credit = lines.reduce((s, l) => s + l.credit, 0);
    const is_balanced  = Math.abs(total_debit - total_credit) < 0.01;

    const tb = await TrialBalance.create({
      company_id: req.user.company_id,
      period_date, financial_year,
      lines, total_debit, total_credit, is_balanced
    });
    return ok(res, tb, 'Trial balance generated', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /balance-sheet
router.get('/balance-sheet', async (req, res) => {
  try {
    const assetTypes     = ['asset', 'bank', 'cash', 'receivable'];
    const liabilityTypes = ['liability', 'payable', 'tax'];

    const [assetAgg, liabilityAgg, equityAgg] = await Promise.all([
      ChartOfAccount.aggregate([
        { $match: { company_id: req.user.company_id, type: { $in: assetTypes } } },
        { $group: { _id: '$type', total: { $sum: '$current_balance' } } }
      ]),
      ChartOfAccount.aggregate([
        { $match: { company_id: req.user.company_id, type: { $in: liabilityTypes } } },
        { $group: { _id: '$type', total: { $sum: '$current_balance' } } }
      ]),
      ChartOfAccount.aggregate([
        { $match: { company_id: req.user.company_id, type: 'equity' } },
        { $group: { _id: null, total: { $sum: '$current_balance' } } }
      ])
    ]);

    const assets      = assetAgg.reduce((o, r) => { o[r._id] = r.total; return o; }, {});
    const liabilities = liabilityAgg.reduce((o, r) => { o[r._id] = r.total; return o; }, {});
    const equity      = equityAgg[0]?.total || 0;

    const total_assets             = Object.values(assets).reduce((s, v) => s + v, 0);
    const total_liabilities_equity = Object.values(liabilities).reduce((s, v) => s + v, 0) + equity;

    return ok(res, { assets, liabilities, equity, total_assets, total_liabilities_equity });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /aging-summary — top 20 customers by outstanding
router.get('/aging-summary', async (req, res) => {
  try {
    const aging = await Invoice.aggregate([
      { $match: { company_id: req.user.company_id, status: { $in: ['issued', 'overdue'] } } },
      { $group: { _id: '$customer_name', outstanding: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { outstanding: -1 } },
      { $limit: 20 },
      { $project: { customer_name: '$_id', outstanding: 1, invoice_count: '$count', _id: 0 } }
    ]);
    return ok(res, aging);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /revenue-by-branch
router.get('/revenue-by-branch', async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const data  = await Invoice.aggregate([
      { $match: { company_id: req.user.company_id, status: 'paid', invoice_date: { $gte: since } } },
      { $group: { _id: '$branch_id', total_revenue: { $sum: '$total' }, count: { $sum: 1 } } },
      { $lookup: { from: 'branches', localField: '_id', foreignField: '_id', as: 'branch' } },
      { $unwind: { path: '$branch', preserveNullAndEmpty: true } },
      { $project: { branch_id: '$_id', branch_name: '$branch.name', total_revenue: 1, count: 1, _id: 0 } },
      { $sort: { total_revenue: -1 } }
    ]);
    return ok(res, data);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /expense-by-category
router.get('/expense-by-category', async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const data  = await Expense.aggregate([
      { $match: { company_id: req.user.company_id, expense_date: { $gte: since } } },
      { $group: { _id: '$category', total_amount: { $sum: '$total_amount' }, count: { $sum: 1 } } },
      { $project: { category: '$_id', total_amount: 1, count: 1, _id: 0 } },
      { $sort: { total_amount: -1 } }
    ]);
    return ok(res, data);
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
