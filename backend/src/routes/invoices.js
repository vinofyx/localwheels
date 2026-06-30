const express = require('express');
const router  = express.Router();
const Invoice = require('../models/Invoice');
const { authenticate, requireRole, requireBranchAccess } = require('../middleware/auth');
const audit = require('../utils/audit');

const ok  = (res, data, message = 'Success', status = 200) => res.status(status).json({ status: true, message, data });
const err = (res, message, status = 400) => res.status(status).json({ status: false, message, errors: [message] });

router.use(authenticate);

function genInvoiceNumber(branchCode = 'LW') {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${branchCode}-${yy}${mm}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

// GET /api/invoices
router.get('/', requireBranchAccess, async (req, res) => {
  try {
    const { status, from_date, to_date, search, page = 1, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id, branch_id: req.branchId };
    if (status) q.status = status;
    if (from_date || to_date) {
      q.invoice_date = {};
      if (from_date) q.invoice_date.$gte = new Date(from_date);
      if (to_date)   q.invoice_date.$lte = new Date(to_date + 'T23:59:59Z');
    }
    if (search) q.$or = [
      { invoice_number: { $regex: search, $options: 'i' } },
      { customer_name:  { $regex: search, $options: 'i' } },
      { lr_number:      { $regex: search, $options: 'i' } },
    ];
    const skip = (Math.max(1, +page) - 1) * Math.min(+limit, 100);
    const lim  = Math.min(+limit, 100);
    const [invoices, total] = await Promise.all([
      Invoice.find(q).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
      Invoice.countDocuments(q),
    ]);
    ok(res, { invoices, total, page: +page, pages: Math.ceil(total / lim) });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/invoices/:id
router.get('/:id', async (req, res) => {
  try {
    const inv = await Invoice.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('branch_id', 'branch_name address phone')
      .populate('shipment_id', 'lr_number status destination')
      .lean();
    if (!inv) return err(res, 'Invoice not found', 404);
    ok(res, inv);
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/invoices
router.post('/', requireBranchAccess, async (req, res) => {
  try {
    const { customer_name, customer_gst, customer_address, customer_phone,
            shipment_id, lr_number, line_items = [], due_date, notes,
            cgst_percent = 9, sgst_percent = 9, igst_percent = 0 } = req.body;
    if (!customer_name) return err(res, 'customer_name is required');
    if (!line_items.length) return err(res, 'At least one line item is required');

    const subtotal = line_items.reduce((s, i) => s + (i.amount || i.quantity * i.rate || 0), 0);
    const cgst     = +(subtotal * cgst_percent / 100).toFixed(2);
    const sgst     = +(subtotal * sgst_percent / 100).toFixed(2);
    const igst     = +(subtotal * igst_percent / 100).toFixed(2);
    const total    = +(subtotal + cgst + sgst + igst).toFixed(2);

    const inv = await Invoice.create({
      company_id: req.user.company_id,
      branch_id:  req.branchId,
      invoice_number: genInvoiceNumber(),
      customer_name, customer_gst, customer_address, customer_phone,
      shipment_id, lr_number, line_items, due_date, notes,
      subtotal, cgst_percent, cgst, sgst_percent, sgst, igst_percent, igst, total,
      created_by: req.user.id,
    });
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'CREATE', resource: 'Invoice', resource_id: inv._id, resource_ref: inv.invoice_number, req });
    ok(res, inv, 'Invoice created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PATCH /api/invoices/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['draft', 'issued', 'paid', 'cancelled'];
    if (!allowed.includes(status)) return err(res, `status must be one of: ${allowed.join(', ')}`);
    const update = { status };
    if (status === 'paid') update.paid_date = new Date();
    const inv = await Invoice.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: update }, { new: true }
    );
    if (!inv) return err(res, 'Invoice not found', 404);
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'STATUS_CHANGE', resource: 'Invoice', resource_id: inv._id, resource_ref: inv.invoice_number, changes: { status }, req });
    ok(res, inv, 'Status updated');
  } catch (e) { err(res, e.message, 500); }
});

// DELETE /api/invoices/:id (cancel only)
router.delete('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const inv = await Invoice.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { status: 'cancelled' } }, { new: true }
    );
    if (!inv) return err(res, 'Invoice not found', 404);
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'DELETE', resource: 'Invoice', resource_id: inv._id, resource_ref: inv.invoice_number, req });
    ok(res, null, 'Invoice cancelled');
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
