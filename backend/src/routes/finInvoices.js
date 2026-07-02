const express = require('express');
const router  = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Invoice = require('../models/Invoice');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true,  message: msg,   data });
const err = (res, msg = 'Error', status = 400)    => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

// GET /stats
router.get('/stats', async (req, res) => {
  try {
    const company_id = String(req.user.company_id);
    const [agg] = await Invoice.aggregate([
      { $match: { company_id } },
      {
        $group: {
          _id: null,
          total_invoices:     { $sum: 1 },
          total_amount:       { $sum: '$total' },
          paid_amount:        { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] } },
          outstanding_amount: { $sum: { $cond: [{ $eq: ['$status', 'issued'] }, '$total', 0] } },
          overdue_count: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'issued'] }, { $lt: ['$due_date', new Date()] }] },
                1, 0
              ]
            }
          }
        }
      }
    ]);
    ok(res, agg || { total_invoices: 0, total_amount: 0, paid_amount: 0, outstanding_amount: 0, overdue_count: 0 });
  } catch (e) { err(res, e.message, 500); }
});

// GET /customer/:name
router.get('/customer/:name', async (req, res) => {
  try {
    const invoices = await Invoice.find({
      company_id:    String(req.user.company_id),
      customer_name: { $regex: req.params.name, $options: 'i' }
    }).sort({ createdAt: -1 });
    ok(res, invoices);
  } catch (e) { err(res, e.message, 500); }
});

// GET /
router.get('/', async (req, res) => {
  try {
    const { status, customer_name, branch_id, date_from, date_to, page = 1 } = req.query;
    const query = { company_id: String(req.user.company_id) };
    if (status)        query.status        = status;
    if (customer_name) query.customer_name = { $regex: customer_name, $options: 'i' };
    if (branch_id)     query.branch_id     = branch_id;
    if (date_from || date_to) {
      query.invoice_date = {};
      if (date_from) query.invoice_date.$gte = new Date(date_from);
      if (date_to)   query.invoice_date.$lte = new Date(date_to);
    }
    const skip = (Number(page) - 1) * 50;
    const [invoices, total] = await Promise.all([
      Invoice.find(query).sort({ createdAt: -1 }).skip(skip).limit(50),
      Invoice.countDocuments(query)
    ]);
    ok(res, { invoices, total, page: Number(page) });
  } catch (e) { err(res, e.message, 500); }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const {
      invoice_number, customer_name, customer_id, customer_gst, customer_address,
      branch_id, invoice_date, due_date, line_items = [],
      cgst_percent = 0, sgst_percent = 0, igst_percent = 0, notes
    } = req.body;

    const subtotal = line_items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const cgst     = subtotal * Number(cgst_percent) / 100;
    const sgst     = subtotal * Number(sgst_percent) / 100;
    const igst     = subtotal * Number(igst_percent) / 100;
    const total    = subtotal + cgst + sgst + igst;

    const invoice = await Invoice.create({
      company_id: String(req.user.company_id),
      invoice_number, customer_name, customer_id, customer_gst, customer_address,
      branch_id, invoice_date, due_date, line_items,
      cgst_percent, sgst_percent, igst_percent,
      subtotal, cgst, sgst, igst, total,
      notes,
      status: 'issued'
    });
    ok(res, invoice, 'Invoice created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, company_id: String(req.user.company_id) });
    if (!invoice) return err(res, 'Invoice not found', 404);
    ok(res, invoice);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, company_id: String(req.user.company_id) });
    if (!invoice) return err(res, 'Invoice not found', 404);
    if (!['draft', 'issued'].includes(invoice.status)) return err(res, 'Cannot edit invoice in current status');

    const {
      customer_name, customer_id, customer_gst, customer_address,
      branch_id, invoice_date, due_date, line_items,
      cgst_percent, sgst_percent, igst_percent, notes
    } = req.body;

    if (line_items !== undefined) {
      const cp = cgst_percent ?? invoice.cgst_percent;
      const sp = sgst_percent ?? invoice.sgst_percent;
      const ip = igst_percent ?? invoice.igst_percent;
      const subtotal = line_items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      invoice.line_items = line_items;
      invoice.subtotal   = subtotal;
      invoice.cgst       = subtotal * Number(cp) / 100;
      invoice.sgst       = subtotal * Number(sp) / 100;
      invoice.igst       = subtotal * Number(ip) / 100;
      invoice.total      = invoice.subtotal + invoice.cgst + invoice.sgst + invoice.igst;
    }
    if (customer_name    !== undefined) invoice.customer_name    = customer_name;
    if (customer_id      !== undefined) invoice.customer_id      = customer_id;
    if (customer_gst     !== undefined) invoice.customer_gst     = customer_gst;
    if (customer_address !== undefined) invoice.customer_address = customer_address;
    if (branch_id        !== undefined) invoice.branch_id        = branch_id;
    if (invoice_date     !== undefined) invoice.invoice_date     = invoice_date;
    if (due_date         !== undefined) invoice.due_date         = due_date;
    if (cgst_percent     !== undefined) invoice.cgst_percent     = cgst_percent;
    if (sgst_percent     !== undefined) invoice.sgst_percent     = sgst_percent;
    if (igst_percent     !== undefined) invoice.igst_percent     = igst_percent;
    if (notes            !== undefined) invoice.notes            = notes;

    await invoice.save();
    ok(res, invoice, 'Invoice updated');
  } catch (e) { err(res, e.message, 500); }
});

// PUT /:id/cancel
router.put('/:id/cancel', async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, company_id: String(req.user.company_id) },
      { status: 'cancelled' },
      { new: true }
    );
    if (!invoice) return err(res, 'Invoice not found', 404);
    ok(res, invoice, 'Invoice cancelled');
  } catch (e) { err(res, e.message, 500); }
});

// PUT /:id/mark-paid
router.put('/:id/mark-paid', async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, company_id: String(req.user.company_id) },
      { status: 'paid', paid_date: new Date() },
      { new: true }
    );
    if (!invoice) return err(res, 'Invoice not found', 404);
    ok(res, invoice, 'Invoice marked as paid');
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
