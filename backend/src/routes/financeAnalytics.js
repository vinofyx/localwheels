const express         = require('express');
const router          = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Invoice         = require('../models/Invoice');
const CustomerPayment = require('../models/CustomerPayment');
const VendorPayment   = require('../models/VendorPayment');
const Expense         = require('../models/Expense');
const CashFlow        = require('../models/CashFlow');
const ProfitLoss      = require('../models/ProfitLoss');
const GSTReturn       = require('../models/GSTReturn');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

// GET /dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const now  = new Date();
    const som  = new Date(now.getFullYear(), now.getMonth(), 1);
    const soy  = new Date(now.getFullYear(), 0, 1);
    const cid  = req.user.company_id;

    const [revMtdAgg, revYtdAgg, expMtdAgg, outstandingAgg, paidCount, totalIssued, pl] = await Promise.all([
      Invoice.aggregate([
        { $match: { company_id: cid, status: 'paid', invoice_date: { $gte: som } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Invoice.aggregate([
        { $match: { company_id: cid, status: 'paid', invoice_date: { $gte: soy } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Expense.aggregate([
        { $match: { company_id: cid, status: { $in: ['approved', 'paid'] }, expense_date: { $gte: som } } },
        { $group: { _id: null, total: { $sum: '$total_amount' } } }
      ]),
      Invoice.aggregate([
        { $match: { company_id: cid, status: 'issued' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Invoice.countDocuments({ company_id: cid, status: 'paid', invoice_date: { $gte: som } }),
      Invoice.countDocuments({ company_id: cid, invoice_date: { $gte: som } }),
      ProfitLoss.findOne({ company_id: cid }).sort({ period_date: -1 })
    ]);

    const revenue_mtd   = revMtdAgg[0]?.total  || 0;
    const revenue_ytd   = revYtdAgg[0]?.total  || 0;
    const expenses_mtd  = expMtdAgg[0]?.total  || 0;
    const outstanding   = outstandingAgg[0]?.total || 0;
    const collection_rate = totalIssued > 0 ? parseFloat(((paidCount / totalIssued) * 100).toFixed(2)) : 0;
    const net_profit_mtd  = revenue_mtd - expenses_mtd;

    return ok(res, { revenue_mtd, revenue_ytd, expenses_mtd, outstanding, collection_rate, net_profit_mtd });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /trends — last 6 months
router.get('/trends', async (req, res) => {
  try {
    const cid    = req.user.company_id;
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      months.push(d);
    }

    const trends = await Promise.all(months.map(async (start) => {
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
      const label = start.toLocaleString('default', { month: 'short', year: 'numeric' });

      const [revAgg, expAgg] = await Promise.all([
        Invoice.aggregate([
          { $match: { company_id: cid, status: 'paid', invoice_date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ]),
        Expense.aggregate([
          { $match: { company_id: cid, expense_date: { $gte: start, $lte: end } } },
          { $group: { _id: null, total: { $sum: '$total_amount' } } }
        ])
      ]);

      const revenue  = revAgg[0]?.total || 0;
      const expenses = expAgg[0]?.total || 0;
      return { month: label, revenue, expenses, profit: revenue - expenses };
    }));

    return ok(res, trends);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /cashflow-summary
router.get('/cashflow-summary', async (req, res) => {
  try {
    const records = await CashFlow.find({ company_id: req.user.company_id })
      .sort({ period_date: 1 })
      .limit(6);
    return ok(res, records);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /top-customers
router.get('/top-customers', async (req, res) => {
  try {
    const top = await CustomerPayment.aggregate([
      { $match: { company_id: req.user.company_id } },
      { $group: { _id: '$customer_id', customer_name: { $first: '$customer_name' }, total_paid: { $sum: '$amount' } } },
      { $sort: { total_paid: -1 } },
      { $limit: 10 },
      { $project: { customer_id: '$_id', customer_name: 1, total_paid: 1, _id: 0 } }
    ]);
    return ok(res, top);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /payment-modes
router.get('/payment-modes', async (req, res) => {
  try {
    const modes = await CustomerPayment.aggregate([
      { $match: { company_id: req.user.company_id } },
      { $group: { _id: '$payment_mode', total_amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $project: { payment_mode: '$_id', total_amount: 1, count: 1, _id: 0 } },
      { $sort: { total_amount: -1 } }
    ]);
    return ok(res, modes);
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
