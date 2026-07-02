const express = require('express');
const router  = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const CustomerPayment = require('../models/CustomerPayment');
const VendorPayment   = require('../models/VendorPayment');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true,  message: msg,   data });
const err = (res, msg = 'Error', status = 400)    => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

// ── helpers ──────────────────────────────────────────────────────────────────

async function genPaymentNo(prefix, Model, field = 'payment_no') {
  const today   = new Date();
  const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
  const pattern  = new RegExp(`^${prefix}-${yyyymmdd}-`);
  const count    = await Model.countDocuments({ [field]: pattern });
  return `${prefix}-${yyyymmdd}-${String(count + 1).padStart(4, '0')}`;
}

// ── Customer Payments ─────────────────────────────────────────────────────────

// GET /stats
router.get('/stats', async (req, res) => {
  try {
    const company_id = String(req.user.company_id);
    const [agg] = await CustomerPayment.aggregate([
      { $match: { company_id } },
      {
        $group: {
          _id: null,
          total_collected: { $sum: { $cond: [{ $eq: ['$status', 'allocated'] }, '$amount', 0] } },
          total_pending:   { $sum: { $cond: [{ $eq: ['$status', 'pending']   }, '$amount', 0] } },
          advance_balance: { $sum: '$unallocated_amount' }
        }
      }
    ]);

    // avg collection days: avg of (payment_date - invoice_date) across allocated invoices
    // Simplified: return 0 if not computable without join
    const stats = agg || { total_collected: 0, total_pending: 0, advance_balance: 0 };
    stats.avg_collection_days = 0;
    ok(res, stats);
  } catch (e) { err(res, e.message, 500); }
});

// GET /vendor  (must come before /:id)
router.get('/vendor', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const query = { company_id: String(req.user.company_id) };
    const skip  = (Number(page) - 1) * 50;
    const [payments, total] = await Promise.all([
      VendorPayment.find(query).sort({ createdAt: -1 }).skip(skip).limit(50),
      VendorPayment.countDocuments(query)
    ]);
    ok(res, { payments, total, page: Number(page) });
  } catch (e) { err(res, e.message, 500); }
});

// POST /vendor
router.post('/vendor', async (req, res) => {
  try {
    const payment_no = await genPaymentNo('VP', VendorPayment);
    const payment = await VendorPayment.create({
      company_id: String(req.user.company_id),
      payment_no,
      ...req.body
    });
    ok(res, payment, 'Vendor payment created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// GET /vendor/:id
router.get('/vendor/:id', async (req, res) => {
  try {
    const payment = await VendorPayment.findOne({ _id: req.params.id, company_id: String(req.user.company_id) });
    if (!payment) return err(res, 'Vendor payment not found', 404);
    ok(res, payment);
  } catch (e) { err(res, e.message, 500); }
});

// GET /
router.get('/', async (req, res) => {
  try {
    const { status, customer_name, date_from, date_to, page = 1 } = req.query;
    const query = { company_id: String(req.user.company_id) };
    if (status)        query.status        = status;
    if (customer_name) query.customer_name = { $regex: customer_name, $options: 'i' };
    if (date_from || date_to) {
      query.payment_date = {};
      if (date_from) query.payment_date.$gte = new Date(date_from);
      if (date_to)   query.payment_date.$lte = new Date(date_to);
    }
    const skip = (Number(page) - 1) * 50;
    const [payments, total] = await Promise.all([
      CustomerPayment.find(query).sort({ createdAt: -1 }).skip(skip).limit(50),
      CustomerPayment.countDocuments(query)
    ]);
    ok(res, { payments, total, page: Number(page) });
  } catch (e) { err(res, e.message, 500); }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const payment_no = await genPaymentNo('CP', CustomerPayment);
    const amount     = Number(req.body.amount) || 0;
    const payment = await CustomerPayment.create({
      company_id: String(req.user.company_id),
      payment_no,
      unallocated_amount: amount,
      allocated_amount: 0,
      status: 'pending',
      ...req.body,
      amount
    });
    ok(res, payment, 'Customer payment created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const payment = await CustomerPayment.findOne({ _id: req.params.id, company_id: String(req.user.company_id) });
    if (!payment) return err(res, 'Payment not found', 404);
    ok(res, payment);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /:id/allocate
router.put('/:id/allocate', async (req, res) => {
  try {
    const payment = await CustomerPayment.findOne({ _id: req.params.id, company_id: String(req.user.company_id) });
    if (!payment) return err(res, 'Payment not found', 404);

    const allocations = req.body; // [{invoice_id, allocated_amount}]
    if (!Array.isArray(allocations)) return err(res, 'Body must be an array of allocations');

    const existing  = payment.allocated_invoices || [];
    const merged    = [...existing];

    for (const alloc of allocations) {
      const idx = merged.findIndex(a => String(a.invoice_id) === String(alloc.invoice_id));
      if (idx >= 0) merged[idx].allocated_amount = Number(alloc.allocated_amount);
      else merged.push({ invoice_id: alloc.invoice_id, allocated_amount: Number(alloc.allocated_amount) });
    }

    const allocated_amount   = merged.reduce((s, a) => s + Number(a.allocated_amount), 0);
    const unallocated_amount = Number(payment.amount) - allocated_amount;

    payment.allocated_invoices  = merged;
    payment.allocated_amount    = allocated_amount;
    payment.unallocated_amount  = unallocated_amount;
    payment.status              = unallocated_amount <= 0 ? 'allocated' : 'partial';
    await payment.save();
    ok(res, payment, 'Payment allocated');
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
