const express        = require('express');
const router         = express.Router();
const Shipment       = require('../models/Shipment');
const TrackingEvent  = require('../models/TrackingEvent');
const { authenticate } = require('../middleware/auth');
const audit = require('../utils/audit');

const ok  = (res, data, message = 'Success', status = 200) => res.status(status).json({ status: true, message, data });
const err = (res, message, status = 400) => res.status(status).json({ status: false, message, errors: [message] });

// GET /api/tracking/:lr  — public (no auth)
// Returns public-facing tracking data + full event timeline
router.get('/:lr', async (req, res) => {
  try {
    const lr = req.params.lr.trim().toUpperCase();
    const { company_id } = req.query;

    const q = { lr_number: lr };
    if (company_id) q.company_id = company_id;

    const shipment = await Shipment.findOne(q)
      .populate('branch_id', 'branch_name city phone')
      .lean();
    if (!shipment) return err(res, `No shipment found for LR "${lr}"`, 404);

    const events = await TrackingEvent.find({ shipment_id: shipment._id })
      .sort({ event_time: 1 })
      .lean();

    ok(res, {
      lr_number:    shipment.lr_number,
      status:       shipment.status,
      sender_name:  shipment.sender_name,
      receiver_name: shipment.receiver_name,
      destination:  shipment.destination,
      weight:       shipment.weight,
      packages:     shipment.packages,
      booking_date: shipment.booking_date,
      origin_branch: shipment.branch_id?.branch_name || null,
      events,
    });
  } catch (e) { err(res, e.message, 500); }
});

// All routes below require auth
router.use(authenticate);

// POST /api/tracking/:shipmentId/event — add tracking event
router.post('/:shipmentId/event', async (req, res) => {
  try {
    const { event_type, location, description, event_time } = req.body;
    if (!event_type) return err(res, 'event_type is required');

    const shipment = await Shipment.findOne({ _id: req.params.shipmentId, company_id: req.user.company_id });
    if (!shipment) return err(res, 'Shipment not found', 404);

    const event = await TrackingEvent.create({
      shipment_id: shipment._id,
      company_id:  req.user.company_id,
      event_type, location, description,
      event_time:  event_time || new Date(),
      created_by:  req.user.id,
    });
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'CREATE', resource: 'TrackingEvent', resource_id: event._id, resource_ref: shipment.lr_number, changes: { event_type, location }, req });
    ok(res, event, 'Event added', 201);
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/tracking/events/:shipmentId — full event history (authenticated)
router.get('/events/:shipmentId', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.shipmentId, company_id: req.user.company_id });
    if (!shipment) return err(res, 'Shipment not found', 404);
    const events = await TrackingEvent.find({ shipment_id: shipment._id })
      .sort({ event_time: 1 }).populate('created_by', 'full_name username').lean();
    ok(res, { lr_number: shipment.lr_number, events });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
