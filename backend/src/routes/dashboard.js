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

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      today_expiry_eway_bill,
      hold_lost_cn,
      undelivered_lr_return,
    ] = await Promise.all([
      Shipment.countDocuments({
        ...base,
        eway_bill: { $ne: null },
        eway_bill_expiry: { $ne: null, $lte: todayEnd },
        status: { $nin: ['delivered', 'returned'] },
      }),
      Shipment.countDocuments({ ...base, status: { $in: ['hold', 'lost'] } }),
      Shipment.countDocuments({ ...base, status: 'returned' }),
    ]);

    // Qty aggregations
    const [shortAgg, damageAgg] = await Promise.all([
      Shipment.aggregate([
        { $match: { ...base, short_qty: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$short_qty' } } },
      ]),
      Shipment.aggregate([
        { $match: { ...base, damage_qty: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$damage_qty' } } },
      ]),
    ]);
    const short_qty = shortAgg[0]?.total || 0;
    const damage_qty = damageAgg[0]?.total || 0;

    // POD metrics — delivered shipments
    const deliveredShipments = await Shipment.find({ ...base, status: 'delivered' }).select('_id').lean();
    const deliveredIds = deliveredShipments.map(s => s._id);

    const [podSubmitPending, podSendPending] = await Promise.all([
      // delivered with no POD or POD status=pending
      (async () => {
        const pods = await POD.find({ shipment_id: { $in: deliveredIds } }).select('shipment_id status').lean();
        const podMap = Object.fromEntries(pods.map(p => [p.shipment_id.toString(), p.status]));
        return deliveredIds.filter(id => {
          const s = podMap[id.toString()];
          return !s || s === 'pending';
        }).length;
      })(),
      POD.countDocuments({ shipment_id: { $in: deliveredIds }, status: 'uploaded' }),
    ]);

    // Payment aggregations
    const [payAgg] = await Payment.aggregate([
      { $match: base },
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
      pod_received:     podSubmitPending,
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
