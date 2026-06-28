const express = require('express');
const mongoose = require('mongoose');
const Shipment = require('../models/Shipment');
const POD = require('../models/POD');
const Payment = require('../models/Payment');
const { authenticate, requireBranchAccess } = require('../middleware/auth');

const router = express.Router();
const ObjId = id => new mongoose.Types.ObjectId(id);

router.get('/', authenticate, requireBranchAccess, async (req, res, next) => {
  try {
    const companyId = ObjId(req.user.company_id);
    const branchId = ObjId(req.branchId);
    const base = { company_id: companyId, branch_id: branchId };

    // ── Date range filter (from_date / to_date from frontend) ────────────────
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let dateFilter = {};
    if (req.query.from_date || req.query.to_date) {
      dateFilter.booking_date = {};
      if (req.query.from_date) dateFilter.booking_date.$gte = new Date(req.query.from_date);
      if (req.query.to_date) {
        const to = new Date(req.query.to_date);
        to.setHours(23, 59, 59, 999);
        dateFilter.booking_date.$lte = to;
      }
    }
    const baseWithDate = { ...base, ...dateFilter };

    const [
      today_expiry_eway_bill,
      hold_lost_cn,
      undelivered_lr_return,
    ] = await Promise.all([
      Shipment.countDocuments({
        ...baseWithDate,
        eway_bill: { $ne: null },
        eway_bill_expiry: { $ne: null, $lte: todayEnd },
        status: { $nin: ['delivered', 'returned'] },
      }),
      Shipment.countDocuments({ ...baseWithDate, status: { $in: ['hold', 'lost'] } }),
      Shipment.countDocuments({ ...baseWithDate, status: 'returned' }),
    ]);

    // Qty aggregations
    const [shortAgg, damageAgg] = await Promise.all([
      Shipment.aggregate([
        { $match: { ...baseWithDate, short_qty: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$short_qty' } } },
      ]),
      Shipment.aggregate([
        { $match: { ...baseWithDate, damage_qty: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$damage_qty' } } },
      ]),
    ]);
    const short_qty = shortAgg[0]?.total || 0;
    const damage_qty = damageAgg[0]?.total || 0;

    // POD metrics — delivered shipments (scoped to date range)
    const deliveredShipments = await Shipment.find({ ...baseWithDate, status: 'delivered' }).select('_id').lean();
    const deliveredIds = deliveredShipments.map(s => s._id);

    const [podSubmitPending, podSendPending, podReceivedPending] = await Promise.all([
      // pod_submit: delivered shipments with no POD or POD status=pending
      (async () => {
        const pods = await POD.find({ shipment_id: { $in: deliveredIds } }).select('shipment_id status').lean();
        const podMap = Object.fromEntries(pods.map(p => [p.shipment_id.toString(), p.status]));
        return deliveredIds.filter(id => {
          const s = podMap[id.toString()];
          return !s || s === 'pending';
        }).length;
      })(),
      // pod_send: uploaded but not yet verified
      POD.countDocuments({ shipment_id: { $in: deliveredIds }, status: 'uploaded' }),
      // pod_received: verified PODs (received back at office)
      POD.countDocuments({ shipment_id: { $in: deliveredIds }, status: 'verified' }),
    ]);

    // Payment aggregations (scoped to date range)
    const [payAgg] = await Payment.aggregate([
      { $match: baseWithDate },
      {
        $group: {
          _id: null,
          paid_outstanding: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'pending'] }, { $eq: ['$payment_type', 'paid'] }] }, '$amount', 0] } },
          topay_outstanding: { $sum: { $cond: [{ $and: [{ $in: ['$status', ['pending', 'partial']] }, { $eq: ['$payment_type', 'topay'] }] }, '$amount', 0] } },
          overdue_outstanding: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, '$amount', 0] } },
        },
      },
    ]);

    res.json({
      eway_expiry:      today_expiry_eway_bill,
      hold_cn:          hold_lost_cn,
      short_qty,
      damage_qty,
      excess_qty:       0,
      undelivered_lr:   undelivered_lr_return,
      pod_submit:       podSubmitPending,
      pod_send:         podSendPending,
      pod_received:     podReceivedPending,
      pod_reject:       0,
      paid_outstanding: payAgg?.paid_outstanding || 0,
      to_pay:           payAgg?.topay_outstanding || 0,
      overdue:          payAgg?.overdue_outstanding || 0,
      bill_pending:     0,
      cash:             0,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
