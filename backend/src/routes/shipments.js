const express = require('express');
const Company = require('../models/Company');
const Shipment = require('../models/Shipment');
const POD = require('../models/POD');
const Payment = require('../models/Payment');
const { authenticate, requireBranchAccess } = require('../middleware/auth');

const router = express.Router();

// ── Helper: format date to DD/MM/YYYY ────────────────────────────────────────
function fmtDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
}

async function generateLR(companyId) {
  const company = await Company.findByIdAndUpdate(
    companyId,
    { $inc: { lr_counter: 1 } },
    { new: true }
  );
  return `LW${String(company.lr_counter).padStart(8, '0')}`;
}

// ── GET /api/shipments (list) ─────────────────────────────────────────────────
router.get('/', authenticate, requireBranchAccess, async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20, payment_type, date_from, date_to } = req.query;
    const filter = { company_id: req.user.company_id, branch_id: req.branchId };

    if (status) filter.status = status;
    if (payment_type) filter.payment_type = payment_type;
    if (date_from || date_to) {
      filter.booking_date = {};
      if (date_from) filter.booking_date.$gte = new Date(date_from);
      if (date_to) filter.booking_date.$lte = new Date(date_to + 'T23:59:59.999Z');
    }
    if (search) {
      filter.$or = [
        { lr_number: { $regex: search, $options: 'i' } },
        { sender_name: { $regex: search, $options: 'i' } },
        { receiver_name: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Shipment.countDocuments(filter);
    const shipments = await Shipment.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const shipmentIds = shipments.map(s => s._id);
    const pods = await POD.find({ shipment_id: { $in: shipmentIds } }).select('shipment_id status').lean();
    const podMap = Object.fromEntries(pods.map(p => [p.shipment_id.toString(), p.status]));

    const data = shipments.map(s => ({
      ...s,
      id:           s._id.toString(),          // ← normalised string id
      booking_date: fmtDate(s.booking_date),
      pod_status:   podMap[s._id.toString()] || null,
    }));

    res.json({
      data,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/shipments/track/:lr (public) ─────────────────────────────────────
router.get('/track/:lr', async (req, res, next) => {
  try {
    const shipment = await Shipment.findOne({ lr_number: req.params.lr.toUpperCase() })
      .populate('branch_id', 'branch_name')
      .lean();
    if (!shipment) return res.status(404).json({ error: 'LR not found' });

    const pod = await POD.findOne({ shipment_id: shipment._id }).lean();
    res.json({
      lr_number:     shipment.lr_number,
      sender_name:   shipment.sender_name,
      receiver_name: shipment.receiver_name,
      destination:   shipment.destination,
      status:        shipment.status,
      booking_date:  fmtDate(shipment.booking_date),
      packages:      shipment.packages,
      weight:        shipment.weight,
      origin_branch: shipment.branch_id?.branch_name,
      delivery_date: pod ? fmtDate(pod.delivery_date) : null,
      pod_status:    pod?.status,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/shipments/:id ────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('branch_id', 'branch_name')
      .lean();
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    const pod     = await POD.findOne({ shipment_id: shipment._id }).lean();
    const payment = await Payment.findOne({ shipment_id: shipment._id }).lean();

    res.json({
      ...shipment,
      id:              shipment._id.toString(),
      booking_date:    fmtDate(shipment.booking_date),
      eway_bill_expiry: shipment.eway_bill_expiry ? fmtDate(shipment.eway_bill_expiry) : null,
      branch_name:     shipment.branch_id?.branch_name,
      pod_status:      pod?.status,
      delivery_date:   pod ? fmtDate(pod.delivery_date) : null,
      pod_receiver:    pod?.receiver_name,
      payment_amount:  payment?.amount,
      payment_status:  payment?.status,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/shipments ───────────────────────────────────────────────────────
router.post('/', authenticate, requireBranchAccess, async (req, res, next) => {
  try {
    const {
      sender_name, sender_phone, sender_address,
      receiver_name, receiver_phone, receiver_address,
      destination, weight, packages, description,
      freight_amount, payment_type, eway_bill, eway_bill_expiry,
    } = req.body;

    if (!sender_name || !receiver_name || !destination) {
      return res.status(400).json({ error: 'sender_name, receiver_name, destination required' });
    }

    const lr_number = await generateLR(req.user.company_id);
    const shipment = await Shipment.create({
      company_id: req.user.company_id,
      branch_id:  req.branchId,
      lr_number,
      sender_name, sender_phone, sender_address,
      receiver_name, receiver_phone, receiver_address,
      destination,
      weight:         weight || 0,
      packages:       packages || 1,
      description,
      freight_amount: freight_amount || 0,
      payment_type:   payment_type || 'topay',
      eway_bill:      eway_bill || null,
      eway_bill_expiry: eway_bill_expiry ? new Date(eway_bill_expiry) : null,
      created_by:     req.user.id,
    });

    // Auto-create payment record for topay/fob
    if (['topay', 'fob'].includes(payment_type) && freight_amount) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15);
      await Payment.create({
        shipment_id:  shipment._id,
        company_id:   req.user.company_id,
        branch_id:    req.branchId,
        amount:       freight_amount,
        payment_type,
        status:       'pending',
        due_date:     dueDate,
      });
    }

    res.status(201).json({ id: shipment._id.toString(), lr_number });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/shipments/:id/status ──────────────────────────────────────────
router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['booked', 'in_transit', 'out_for_delivery', 'delivered', 'hold', 'lost', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await Shipment.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { status }
    );

    if (status === 'delivered') {
      await POD.findOneAndUpdate(
        { shipment_id: req.params.id },
        { shipment_id: req.params.id, status: 'pending' },
        { upsert: true }
      );
    }

    res.json({ success: true, status });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/shipments/:id ────────────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { short_qty, damage_qty, eway_bill, eway_bill_expiry } = req.body;
    await Shipment.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      {
        short_qty:    short_qty  || 0,
        damage_qty:   damage_qty || 0,
        eway_bill,
        eway_bill_expiry: eway_bill_expiry ? new Date(eway_bill_expiry) : null,
      }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
