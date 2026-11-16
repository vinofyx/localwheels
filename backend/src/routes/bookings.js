const express = require('express');
const router  = express.Router();
const Booking = require('../models/Booking');
const { authenticate, requireBranchAccess } = require('../middleware/auth');
const audit = require('../utils/audit');

const ok  = (res, data, message = 'Success', status = 200) => res.status(status).json({ status: true, message, data });
const err = (res, message, status = 400) => res.status(status).json({ status: false, message, errors: [message] });

router.use(authenticate);

function genBookingNumber() {
  return `BK${Date.now().toString(36).toUpperCase()}`;
}

// GET /api/bookings
router.get('/', requireBranchAccess, async (req, res) => {
  try {
    const { status, service_type, page = 1, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id, branch_id: req.branchId };
    if (status)       q.status = status;
    if (service_type) q.service_type = service_type;
    const skip = (Math.max(1, +page) - 1) * Math.min(+limit, 100);
    const lim  = Math.min(+limit, 100);
    const [bookings, total] = await Promise.all([
      Booking.find(q).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
      Booking.countDocuments(q),
    ]);
    ok(res, { bookings, total, page: +page, pages: Math.ceil(total / lim) });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/bookings/:id
router.get('/:id', async (req, res) => {
  try {
    const b = await Booking.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('shipment_id', 'lr_number status').lean();
    if (!b) return err(res, 'Booking not found', 404);
    ok(res, b);
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/bookings
router.post('/', requireBranchAccess, async (req, res) => {
  try {
    const { sender_name, sender_phone, sender_address, pickup_address, pickup_date,
            receiver_name, receiver_phone, receiver_address, destination,
            goods_description, estimated_weight, estimated_packages, service_type } = req.body;
    if (!sender_name || !pickup_address || !receiver_name || !destination)
      return err(res, 'sender_name, pickup_address, receiver_name, destination are required');
    const b = await Booking.create({
      company_id: req.user.company_id,
      branch_id:  req.branchId,
      booking_number: genBookingNumber(),
      sender_name, sender_phone, sender_address, pickup_address, pickup_date,
      receiver_name, receiver_phone, receiver_address, destination,
      goods_description, estimated_weight, estimated_packages, service_type,
      created_by: req.user.id,
    });
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'CREATE', resource: 'Booking', resource_id: b._id, resource_ref: b.booking_number, req });
    ok(res, b, 'Booking created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PATCH /api/bookings/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, cancellation_reason } = req.body;
    const allowed = ['pending', 'confirmed', 'pickup_done', 'cancelled'];
    if (!allowed.includes(status)) return err(res, `status must be one of: ${allowed.join(', ')}`);
    const update = { status };
    if (status === 'cancelled' && cancellation_reason) update.cancellation_reason = cancellation_reason;
    const b = await Booking.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: update }, { new: true }
    );
    if (!b) return err(res, 'Booking not found', 404);

    // When pickup is completed, auto-create shipment and link to booking
    if (status === 'pickup_done' && !b.shipment_id) {
      const Company  = require('../models/Company');
      const Shipment = require('../models/Shipment');
      const company = await Company.findByIdAndUpdate(
        b.company_id,
        { $inc: { lr_counter: 1 } },
        { new: true }
      );
      const lr_number = `LW${String(company ? company.lr_counter : Date.now()).padStart(8, '0')}`;
      const shipment = await Shipment.create({
        company_id:       b.company_id,
        branch_id:        b.branch_id,
        lr_number,
        sender_name:      b.sender_name,
        sender_phone:     b.sender_phone || '',
        sender_address:   b.sender_address || b.pickup_address,
        receiver_name:    b.receiver_name,
        receiver_phone:   b.receiver_phone || '',
        receiver_address: b.receiver_address || '',
        destination:      b.destination,
        weight:           b.estimated_weight || 1,
        packages:         b.estimated_packages || 1,
        description:      b.goods_description || '',
        status:           'booked',
        created_by:       req.user.id,
      });
      b.shipment_id = shipment._id;
      await b.save();
    }

    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'STATUS_CHANGE', resource: 'Booking', resource_id: b._id, resource_ref: b.booking_number, changes: { status }, req });
    ok(res, b, 'Status updated');
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/bookings/:id
router.put('/:id', async (req, res) => {
  try {
    const allowed = [
      'sender_name', 'sender_phone', 'sender_address', 'pickup_address', 'pickup_date',
      'receiver_name', 'receiver_phone', 'receiver_address', 'destination',
      'goods_description', 'estimated_weight', 'estimated_packages', 'service_type',
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    const b = await Booking.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: update }, { new: true, runValidators: true }
    );
    if (!b) return err(res, 'Booking not found', 404);
    ok(res, b, 'Booking updated');
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
