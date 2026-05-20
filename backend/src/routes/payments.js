const express = require('express');
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const { authenticate, requireBranchAccess } = require('../middleware/auth');

const router = express.Router();
const ObjId    = id => new mongoose.Types.ObjectId(id);
const isValidId = id => id && mongoose.Types.ObjectId.isValid(id);

function fmtDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
}

// ── GET /api/payments ─────────────────────────────────────────────────────────
router.get('/', authenticate, requireBranchAccess, async (req, res, next) => {
  try {
    const { status, payment_type, page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id, branch_id: req.branchId };
    if (status) filter.status = status;
    if (payment_type) filter.payment_type = payment_type;

    const total = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
      .populate('shipment_id', 'lr_number sender_name receiver_name destination')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const data = payments.map(p => ({
      ...p,
      id:            p._id.toString(),                      // ← normalised id
      shipment_id:   p.shipment_id?._id?.toString() || p.shipment_id?.toString(), // ← always a string
      lr_number:     p.shipment_id?.lr_number,
      sender_name:   p.shipment_id?.sender_name,
      receiver_name: p.shipment_id?.receiver_name,
      destination:   p.shipment_id?.destination,
      due_date:      fmtDate(p.due_date),
      paid_date:     fmtDate(p.paid_date),
    }));

    const [summary] = await Payment.aggregate([
      { $match: { company_id: ObjId(req.user.company_id), branch_id: ObjId(req.branchId) } },
      {
        $group: {
          _id: null,
          paid_outstanding:  { $sum: { $cond: [{ $and: [{ $eq: ['$status','pending'] }, { $eq: ['$payment_type','paid'] }] }, '$amount', 0] } },
          topay_outstanding: { $sum: { $cond: [{ $and: [{ $in: ['$status',['pending','partial']] }, { $eq: ['$payment_type','topay'] }] }, '$amount', 0] } },
          overdue:           { $sum: { $cond: [{ $eq: ['$status','overdue'] }, '$amount', 0] } },
          collected:         { $sum: { $cond: [{ $eq: ['$status','paid'] }, '$amount', 0] } },
        },
      },
    ]);

    res.json({
      data,
      summary:    summary || { paid_outstanding: 0, topay_outstanding: 0, overdue: 0, collected: 0 },
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/payments/:id/collect ──────────────────────────────────────────
router.patch('/:id/collect', authenticate, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid payment ID' });
    const updated = await Payment.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { status: 'paid', paid_date: new Date() }
    );
    if (!updated) return res.status(404).json({ error: 'Payment not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
