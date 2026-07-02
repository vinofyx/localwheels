const express = require('express');
const router  = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Invoice         = require('../models/Invoice');
const CustomerPayment = require('../models/CustomerPayment');
const AuditEntry      = require('../models/AuditEntry');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true,  message: msg,   data });
const err = (res, msg = 'Error', status = 400)    => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

// GET /aging
router.get('/aging', async (req, res) => {
  try {
    const company_id = String(req.user.company_id);
    const now        = new Date();

    const invoices = await Invoice.find({ company_id, status: 'issued' }, 'invoice_date total customer_name');

    const buckets = {
      current:  { label: '0-30 days',   count: 0, amount: 0 },
      b31_60:   { label: '31-60 days',  count: 0, amount: 0 },
      b61_90:   { label: '61-90 days',  count: 0, amount: 0 },
      b91_120:  { label: '91-120 days', count: 0, amount: 0 },
      over_120: { label: '120+ days',   count: 0, amount: 0 }
    };

    for (const inv of invoices) {
      const days = Math.floor((now - new Date(inv.invoice_date)) / 86400000);
      const amt  = inv.total || 0;
      let key;
      if      (days <= 30)  key = 'current';
      else if (days <= 60)  key = 'b31_60';
      else if (days <= 90)  key = 'b61_90';
      else if (days <= 120) key = 'b91_120';
      else                  key = 'over_120';
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

    const outstanding = await Invoice.find({ company_id, status: 'issued' }, 'total due_date customer_name');

    let total_outstanding = 0;
    let overdue_amount    = 0;
    const debtorMap       = {};

    for (const inv of outstanding) {
      const amt = inv.total || 0;
      total_outstanding += amt;
      if (new Date(inv.due_date) < now) overdue_amount += amt;
      debtorMap[inv.customer_name] = (debtorMap[inv.customer_name] || 0) + amt;
    }

    const paid_total   = await Invoice.aggregate([
      { $match: { company_id, status: 'paid' } },
      { $group: { _id: null, s: { $sum: '$total' } } }
    ]);
    const total_billed = total_outstanding + (paid_total[0]?.s || 0);
    const collection_rate = total_billed > 0 ? ((paid_total[0]?.s || 0) / total_billed * 100).toFixed(2) : '0.00';

    const top_debtors = Object.entries(debtorMap)
      .map(([customer_name, amount]) => ({ customer_name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    ok(res, { total_outstanding, overdue_amount, collection_rate: Number(collection_rate), top_debtors });
  } catch (e) { err(res, e.message, 500); }
});

// GET /customer/:name
router.get('/customer/:name', async (req, res) => {
  try {
    const company_id    = String(req.user.company_id);
    const nameRegex     = { $regex: req.params.name, $options: 'i' };
    const [invoices, payments] = await Promise.all([
      Invoice.find({ company_id, customer_name: nameRegex }).sort({ invoice_date: -1 }),
      CustomerPayment.find({ company_id, customer_name: nameRegex }).sort({ payment_date: -1 })
    ]);
    ok(res, { invoices, payments });
  } catch (e) { err(res, e.message, 500); }
});

// POST /reminder
router.post('/reminder', async (req, res) => {
  try {
    const { customer_name, invoice_id, message } = req.body;
    const entry = await AuditEntry.create({
      company_id:  String(req.user.company_id),
      entity_type: 'ar_reminder',
      entity_id:   invoice_id,
      action:      'reminder_sent',
      description: message,
      metadata:    { customer_name, invoice_id },
      performed_by: req.user._id
    });
    ok(res, entry, 'Reminder recorded', 201);
  } catch (e) { err(res, e.message, 500); }
});

// GET /
router.get('/', async (req, res) => {
  try {
    const company_id = String(req.user.company_id);
    const invoices   = await Invoice.find({ company_id, status: 'issued' }).sort({ invoice_date: -1 });

    // group by customer
    const grouped = {};
    for (const inv of invoices) {
      const key = inv.customer_name || 'Unknown';
      if (!grouped[key]) grouped[key] = { customer_name: key, invoices: [], total_outstanding: 0 };
      grouped[key].invoices.push(inv);
      grouped[key].total_outstanding += inv.total || 0;
    }

    ok(res, Object.values(grouped));
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
