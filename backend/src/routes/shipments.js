const express  = require('express');
const mongoose = require('mongoose');
const Company  = require('../models/Company');
const Shipment = require('../models/Shipment');
const POD      = require('../models/POD');
const Payment  = require('../models/Payment');
const { authenticate, requireBranchAccess } = require('../middleware/auth');

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Escape special regex characters to prevent ReDoS via user-supplied search terms */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fmtDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
}

function isValidId(id) {
  return id && mongoose.Types.ObjectId.isValid(id);
}

async function generateLR(companyId) {
  const company = await Company.findByIdAndUpdate(
    companyId,
    { $inc: { lr_counter: 1 } },
    { new: true }
  );
  if (!company) throw new Error('Company not found');
  return `LW${String(company.lr_counter).padStart(8, '0')}`;
}

// ── GET /api/shipments (list) ─────────────────────────────────────────────────
router.get('/', authenticate, requireBranchAccess, async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20, payment_type, date_from, date_to } = req.query;
    const filter = { company_id: req.user.company_id, branch_id: req.branchId };

    if (status)       filter.status       = status;
    if (payment_type) filter.payment_type = payment_type;
    if (date_from || date_to) {
      filter.booking_date = {};
      if (date_from) filter.booking_date.$gte = new Date(date_from);
      if (date_to)   filter.booking_date.$lte = new Date(date_to + 'T23:59:59.999Z');
    }
    if (search) {
      const safeSearch = escapeRegex(search.slice(0, 100)); // cap length + escape
      filter.$or = [
        { lr_number:     { $regex: safeSearch, $options: 'i' } },
        { sender_name:   { $regex: safeSearch, $options: 'i' } },
        { receiver_name: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(100, parseInt(limit) || 20);

    const [total, shipments] = await Promise.all([
      Shipment.countDocuments(filter),
      Shipment.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
    ]);

    const shipmentIds = shipments.map(s => s._id);
    const pods  = await POD.find({ shipment_id: { $in: shipmentIds } }).select('shipment_id status').lean();
    const podMap = Object.fromEntries(pods.map(p => [p.shipment_id.toString(), p.status]));

    const data = shipments.map(s => ({
      ...s,
      id:           s._id.toString(),
      booking_date: fmtDate(s.booking_date),
      pod_status:   podMap[s._id.toString()] || null,
    }));

    res.json({
      data,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) { next(err); }
});

// ── GET /api/shipments/track/:lr (public) ─────────────────────────────────────
router.get('/track/:lr', async (req, res, next) => {
  try {
    const { company_id } = req.query;
    const filter = { lr_number: req.params.lr.toUpperCase() };
    if (company_id && isValidId(company_id)) {
      filter.company_id = company_id;
    }
    const shipment = await Shipment.findOne(filter)
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
      pod_status:    pod?.status || null,
    });
  } catch (err) { next(err); }
});

// ── GET /api/shipments/:id ────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid shipment ID' });
    }
    const shipment = await Shipment.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('branch_id', 'branch_name')
      .lean();
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    const [pod, payment] = await Promise.all([
      POD.findOne({ shipment_id: shipment._id }).lean(),
      Payment.findOne({ shipment_id: shipment._id }).lean(),
    ]);

    res.json({
      ...shipment,
      id:               shipment._id.toString(),
      booking_date:     fmtDate(shipment.booking_date),
      eway_bill_expiry: fmtDate(shipment.eway_bill_expiry),
      branch_name:      shipment.branch_id?.branch_name,
      pod_status:       pod?.status || null,
      delivery_date:    fmtDate(pod?.delivery_date),
      pod_receiver:     pod?.receiver_name || null,
      payment_amount:   payment?.amount    || null,
      payment_status:   payment?.status    || null,
    });
  } catch (err) { next(err); }
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
      return res.status(400).json({ error: 'sender_name, receiver_name and destination are required' });
    }

    const lr_number = await generateLR(req.user.company_id);
    const shipment  = await Shipment.create({
      company_id:    req.user.company_id,
      branch_id:     req.branchId,
      lr_number,
      sender_name, sender_phone, sender_address,
      receiver_name, receiver_phone, receiver_address,
      destination,
      weight:           parseFloat(weight)         || 0,
      packages:         parseInt(packages)         || 1,
      description:      description || '',
      freight_amount:   parseFloat(freight_amount) || 0,
      payment_type:     payment_type || 'topay',
      eway_bill:        eway_bill || null,
      eway_bill_expiry: eway_bill_expiry ? new Date(eway_bill_expiry) : null,
      created_by:       req.user.id,
    });

    // Auto-create payment record
    if (parseFloat(freight_amount) > 0) {
      const isPaid = payment_type === 'paid';
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15);
      await Payment.create({
        shipment_id:  shipment._id,
        company_id:   req.user.company_id,
        branch_id:    req.branchId,
        amount:       parseFloat(freight_amount),
        payment_type: payment_type || 'topay',
        status:       isPaid ? 'paid' : 'pending',
        due_date:     dueDate,
        paid_date:    isPaid ? new Date() : null,
      });
    }

    // Auto-create tracking POD entry
    await POD.findOneAndUpdate(
      { shipment_id: shipment._id },
      { company_id: req.user.company_id, shipment_id: shipment._id, status: 'pending' },
      { upsert: true }
    );

    res.status(201).json({ id: shipment._id.toString(), _id: shipment._id.toString(), lr_number });
  } catch (err) { next(err); }
});

// ── PATCH /api/shipments/:id/status ──────────────────────────────────────────
router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid shipment ID' });
    }
    const { status } = req.body;
    const validStatuses = ['booked', 'in_transit', 'out_for_delivery', 'delivered', 'hold', 'lost', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const updated = await Shipment.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Shipment not found' });

    if (status === 'delivered') {
      await POD.findOneAndUpdate(
        { shipment_id: req.params.id },
        { shipment_id: req.params.id, status: 'pending' },
        { upsert: true }
      );
    }

    res.json({ success: true, status });
  } catch (err) { next(err); }
});

// ── PUT /api/shipments/:id ────────────────────────────────────────────────────
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid shipment ID' });
    }
    const { short_qty, damage_qty, eway_bill, eway_bill_expiry } = req.body;
    const updated = await Shipment.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      {
        short_qty:        short_qty  || 0,
        damage_qty:       damage_qty || 0,
        eway_bill:        eway_bill  || null,
        eway_bill_expiry: eway_bill_expiry ? new Date(eway_bill_expiry) : null,
      }
    );
    if (!updated) return res.status(404).json({ error: 'Shipment not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── POST /api/shipments/:id/transfer ──────────────────────────────────────────
router.post('/:id/transfer', authenticate, async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid shipment ID' });
    }
    const { to_branch_id, notes } = req.body;
    if (!to_branch_id || !isValidId(to_branch_id)) {
      return res.status(400).json({ error: 'Valid to_branch_id is required' });
    }

    const Branch = require('../models/Branch');
    const destBranch = await Branch.findOne({ _id: to_branch_id, company_id: req.user.company_id });
    if (!destBranch) {
      return res.status(404).json({ error: 'Destination branch not found' });
    }

    const shipment = await Shipment.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    shipment.branch_id = to_branch_id;
    shipment.status = 'in_transit';
    shipment.current_hub = destBranch.branch_name;
    shipment.current_location_name = destBranch.city || destBranch.branch_name;
    await shipment.save();

    await Payment.updateMany({ shipment_id: shipment._id }, { branch_id: to_branch_id });

    res.json({
      success: true,
      message: `Shipment transferred to ${destBranch.branch_name}`,
      shipment: {
        id: shipment._id.toString(),
        lr_number: shipment.lr_number,
        branch_id: shipment.branch_id,
        current_hub: shipment.current_hub,
        status: shipment.status,
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;
