const express = require('express');
const router  = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const VendorPayment = require('../models/VendorPayment');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true,  message: msg,   data });
const err = (res, msg = 'Error', status = 400)    => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

async function genVP(company_id) {
  const today    = new Date();
  const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
  const pattern  = new RegExp(`^VP-${yyyymmdd}-`);
  const count    = await VendorPayment.countDocuments({ company_id, payment_no: pattern });
  return `VP-${yyyymmdd}-${String(count + 1).padStart(4, '0')}`;
}

// GET /aging
router.get('/aging', async (req, res) => {
  try {
    const company_id = String(req.user.company_id);
    const now        = new Date();

    const payments = await VendorPayment.find({ company_id, status: 'pending' }, 'due_date amount vendor_name');

    const buckets = {
      current: { label: '0-30 days',  count: 0, amount: 0 },
      b31_60:  { label: '31-60 days', count: 0, amount: 0 },
      b61_90:  { label: '61-90 days', count: 0, amount: 0 },
      over_91: { label: '91+ days',   count: 0, amount: 0 }
    };

    for (const p of payments) {
      const days = Math.floor((now - new Date(p.due_date)) / 86400000);
      const amt  = p.amount || 0;
      let key;
      if      (days <= 30) key = 'current';
      else if (days <= 60) key = 'b31_60';
      else if (days <= 90) key = 'b61_90';
      else                 key = 'over_91';
      buckets[key].count  += 1;
      buckets[key].amount += amt;
    }

    ok(res, buckets);
  } catch (e) { err(res, e.message, 500); }
});

// GET /dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const company_id = String(req.user.company_id);
    const now        = new Date();

    const pending = await VendorPayment.find({ company_id, status: 'pending' }, 'amount due_date vendor_name');

    let total_payable    = 0;
    let overdue_payable  = 0;
    let on_time_eligible = 0;
    const creditorMap    = {};

    for (const p of pending) {
      const amt = p.amount || 0;
      total_payable += amt;
      if (new Date(p.due_date) < now) overdue_payable += amt;
      else on_time_eligible += amt;
      creditorMap[p.vendor_name] = (creditorMap[p.vendor_name] || 0) + amt;
    }

    const on_time_rate = total_payable > 0
      ? Number((on_time_eligible / total_payable * 100).toFixed(2))
      : 100;

    const top_creditors = Object.entries(creditorMap)
      .map(([vendor_name, amount]) => ({ vendor_name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    ok(res, { total_payable, overdue_payable, on_time_rate, top_creditors });
  } catch (e) { err(res, e.message, 500); }
});

// GET /
router.get('/', async (req, res) => {
  try {
    const company_id = String(req.user.company_id);
    const { page = 1 } = req.query;
    const query = { company_id, status: 'pending' };
    const skip  = (Number(page) - 1) * 50;
    const [payments, total] = await Promise.all([
      VendorPayment.find(query).sort({ due_date: 1 }).skip(skip).limit(50),
      VendorPayment.countDocuments(query)
    ]);
    ok(res, { payments, total, page: Number(page) });
  } catch (e) { err(res, e.message, 500); }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const company_id = String(req.user.company_id);
    const payment_no = await genVP(company_id);
    const payment = await VendorPayment.create({
      company_id,
      payment_no,
      status: 'pending',
      ...req.body
    });
    ok(res, payment, 'Vendor payment created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /:id/pay
router.put('/:id/pay', async (req, res) => {
  try {
    const payment = await VendorPayment.findOneAndUpdate(
      { _id: req.params.id, company_id: String(req.user.company_id) },
      { status: 'paid', paid_date: new Date() },
      { new: true }
    );
    if (!payment) return err(res, 'Vendor payment not found', 404);
    ok(res, payment, 'Vendor payment marked as paid');
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
