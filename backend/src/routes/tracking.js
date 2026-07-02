const express    = require('express');
const router     = express.Router();
const Shipment   = require('../models/Shipment');
const TrackingEvent = require('../models/TrackingEvent');
const GPSLog     = require('../models/GPSLog');
const Anthropic  = require('@anthropic-ai/sdk');
const { authenticate } = require('../middleware/auth');
const audit      = require('../utils/audit');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ok  = (res, data, message = 'Success', status = 200) =>
  res.status(status).json({ status: true, message, data });
const err = (res, message, status = 400) =>
  res.status(status).json({ status: false, message, errors: [message] });

const STATUS_META = {
  booked:               { label: 'Booking Confirmed', color: 'blue',   step: 1 },
  booking_confirmed:    { label: 'Booking Confirmed', color: 'blue',   step: 1 },
  pickup_scheduled:     { label: 'Pickup Scheduled',  color: 'indigo', step: 2 },
  driver_assigned:      { label: 'Driver Assigned',   color: 'violet', step: 3 },
  vehicle_arrived:      { label: 'Vehicle Arrived',   color: 'purple', step: 4 },
  picked_up:            { label: 'Picked Up',         color: 'orange', step: 5 },
  reached_warehouse:    { label: 'At Warehouse',      color: 'amber',  step: 6 },
  warehouse_processing: { label: 'Processing',        color: 'yellow', step: 7 },
  dispatched:           { label: 'Dispatched',        color: 'lime',   step: 8 },
  in_transit:           { label: 'In Transit',        color: 'green',  step: 9 },
  reached_hub:          { label: 'At Hub',            color: 'teal',   step: 10 },
  out_for_delivery:     { label: 'Out for Delivery',  color: 'cyan',   step: 11 },
  delivered:            { label: 'Delivered',         color: 'green',  step: 12 },
  delivery_failed:      { label: 'Delivery Failed',   color: 'red',    step: 11 },
  hold:                 { label: 'On Hold',           color: 'orange', step: 6 },
  lost:                 { label: 'Lost',              color: 'red',    step: 0 },
  returned:             { label: 'Returned',          color: 'gray',   step: 12 },
  cancelled:            { label: 'Cancelled',         color: 'red',    step: 0 },
};

function maskPhone(phone) {
  if (!phone || phone.length < 6) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-3);
}

function buildPublicPayload(shipment, events) {
  const meta = STATUS_META[shipment.status] || { label: shipment.status, color: 'gray', step: 1 };
  return {
    lr_number:     shipment.lr_number,
    awb_number:    shipment.awb_number || null,
    status:        shipment.status,
    status_label:  meta.label,
    status_color:  meta.color,
    status_step:   meta.step,
    sender_name:   shipment.sender_name,
    receiver_name: shipment.receiver_name,
    destination:   shipment.destination,
    weight:        shipment.weight,
    packages:      shipment.packages,
    payment_type:  shipment.payment_type,
    booking_date:  shipment.booking_date,
    delivery_date: shipment.delivery_date || null,
    eta_date:      shipment.eta_date || null,
    eta_confidence: shipment.eta_confidence || null,
    origin_branch: shipment.branch_id?.branch_name || null,
    current_lat:   shipment.current_lat || null,
    current_lng:   shipment.current_lng || null,
    current_location_name: shipment.current_location_name || null,
    last_gps_update: shipment.last_gps_update || null,
    current_hub:   shipment.current_hub || null,
    driver_name:   shipment.driver_name || null,
    driver_phone:  shipment.driver_phone ? maskPhone(shipment.driver_phone) : null,
    vehicle_number: shipment.vehicle_number || null,
    events: events.map(e => ({
      event_type:  e.event_type,
      label:       (STATUS_META[e.event_type] || {}).label || e.event_type.replace(/_/g, ' '),
      location:    e.location || null,
      lat:         e.lat || null,
      lng:         e.lng || null,
      description: e.description || null,
      event_time:  e.event_time,
    })),
  };
}

// ─── PUBLIC: multi-method search ─────────────────────────────────────────────
// GET /api/tracking/search?type=lr|awb|phone&value=xxx
router.get('/search', async (req, res) => {
  try {
    const { type = 'lr', value } = req.query;
    if (!value) return err(res, 'value is required');

    let q = {};
    if (type === 'lr')       q = { lr_number: value.trim().toUpperCase() };
    else if (type === 'awb') q = { awb_number: value.trim().toUpperCase() };
    else if (type === 'phone') {
      q = { $or: [{ sender_phone: value.trim() }, { receiver_phone: value.trim() }] };
    } else return err(res, 'type must be lr, awb, or phone');

    const shipments = await Shipment.find(q)
      .populate('branch_id', 'branch_name city')
      .sort({ booking_date: -1 })
      .limit(10)
      .lean();

    if (!shipments.length) return err(res, 'No shipments found', 404);

    if (type === 'phone') {
      return ok(res, shipments.map(s => ({
        lr_number:    s.lr_number,
        status:       s.status,
        status_label: (STATUS_META[s.status] || {}).label || s.status,
        destination:  s.destination,
        booking_date: s.booking_date,
        receiver_name: s.receiver_name,
      })));
    }

    const events = await TrackingEvent.find({ shipment_id: shipments[0]._id })
      .sort({ event_time: 1 }).lean();
    ok(res, buildPublicPayload(shipments[0], events));
  } catch (e) { err(res, e.message, 500); }
});

// ─── PUBLIC: dispatcher live view (requires auth but placed before /:lr) ─────
// GET /api/tracking/dispatcher
router.get('/dispatcher', authenticate, async (req, res) => {
  try {
    const { status, search } = req.query;
    const q = { company_id: req.user.company_id };

    if (status && status !== 'all') {
      q.status = status;
    } else {
      q.status = { $nin: ['delivered', 'cancelled', 'returned'] };
    }

    if (search) {
      const s = search.toUpperCase();
      q.$or = [
        { lr_number:     new RegExp(s) },
        { vehicle_number: new RegExp(s) },
        { driver_name:   new RegExp(search, 'i') },
        { destination:   new RegExp(search, 'i') },
      ];
    }

    const shipments = await Shipment.find(q)
      .populate('branch_id', 'branch_name city')
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    const ids = shipments.map(s => s._id);
    const latestEvents = await TrackingEvent.aggregate([
      { $match: { shipment_id: { $in: ids } } },
      { $sort: { event_time: -1 } },
      { $group: { _id: '$shipment_id', last_event: { $first: '$$ROOT' } } },
    ]);
    const evtMap = {};
    latestEvents.forEach(e => { evtMap[e._id.toString()] = e.last_event; });

    const data = shipments.map(s => {
      const meta = STATUS_META[s.status] || {};
      const last = evtMap[s._id.toString()];
      return {
        _id:           s._id,
        lr_number:     s.lr_number,
        status:        s.status,
        status_label:  meta.label || s.status,
        status_color:  meta.color || 'gray',
        destination:   s.destination,
        receiver_name: s.receiver_name,
        vehicle_number: s.vehicle_number || null,
        driver_name:   s.driver_name || null,
        current_hub:   s.current_hub || null,
        current_lat:   s.current_lat || null,
        current_lng:   s.current_lng || null,
        current_location_name: s.current_location_name || null,
        last_gps_update: s.last_gps_update || null,
        eta_date:      s.eta_date || null,
        booking_date:  s.booking_date,
        branch:        s.branch_id,
        last_event:    last ? { type: last.event_type, location: last.location, time: last.event_time } : null,
      };
    });

    ok(res, { count: data.length, shipments: data });
  } catch (e) { err(res, e.message, 500); }
});

// ─── PUBLIC: track by LR number ──────────────────────────────────────────────
// GET /api/tracking/:lr
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
      .sort({ event_time: 1 }).lean();

    ok(res, buildPublicPayload(shipment, events));
  } catch (e) { err(res, e.message, 500); }
});

// ─── PUBLIC: AI ETA prediction ───────────────────────────────────────────────
// GET /api/tracking/:lr/eta
router.get('/:lr/eta', async (req, res) => {
  try {
    const lr = req.params.lr.trim().toUpperCase();
    const shipment = await Shipment.findOne({ lr_number: lr }).lean();
    if (!shipment) return err(res, 'Shipment not found', 404);

    const events = await TrackingEvent.find({ shipment_id: shipment._id })
      .sort({ event_time: 1 }).lean();

    const lastEvent = events[events.length - 1];
    const daysSinceBooking = Math.floor((Date.now() - new Date(shipment.booking_date)) / 86400000);
    const meta = STATUS_META[shipment.status] || {};

    const prompt = `You are a logistics ETA prediction engine for LocalWheels, an Indian transport company.

Shipment Data:
- LR: ${shipment.lr_number}
- Status: ${meta.label || shipment.status} (step ${meta.step || '?'} of 12)
- Destination: ${shipment.destination}
- Booked: ${new Date(shipment.booking_date).toLocaleDateString('en-IN')} (${daysSinceBooking} days ago)
- Weight: ${shipment.weight}kg, Packages: ${shipment.packages}
- Driver: ${shipment.driver_name || 'Not assigned'}
- Vehicle: ${shipment.vehicle_number || 'Not assigned'}
- Last event: ${lastEvent ? `${lastEvent.event_type} at ${lastEvent.location || 'unknown location'} on ${new Date(lastEvent.event_time).toLocaleDateString('en-IN')}` : 'No events yet'}
- Total events: ${events.length}

Based on Indian logistics transit patterns, predict the delivery date. Typical transit: 1-2 days local, 3-5 days inter-state, 5-7 days cross-country.

Respond ONLY in this exact JSON format (no extra text):
{"eta_text":"30 June 2026","confidence":75,"reasoning":"Brief 1-2 sentence reason.","delay_risk":"Low","delay_reason":null}`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.trim();
    let eta;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      eta = match ? JSON.parse(match[0]) : { eta_text: 'Unable to estimate', confidence: 0, reasoning: raw, delay_risk: 'Unknown', delay_reason: null };
    } catch {
      eta = { eta_text: 'Unable to estimate', confidence: 0, reasoning: raw, delay_risk: 'Unknown', delay_reason: null };
    }

    ok(res, { lr_number: lr, status: shipment.status, ...eta });
  } catch (e) { err(res, e.message, 500); }
});

// ─── AUTHENTICATED routes ─────────────────────────────────────────────────────

// POST /api/tracking/:shipmentId/gps — GPS ping from driver
router.post('/:shipmentId/gps', authenticate, async (req, res) => {
  try {
    const { lat, lng, speed_kmh, heading, accuracy, vehicle_number, location_name } = req.body;
    if (!lat || !lng) return err(res, 'lat and lng are required');

    const shipment = await Shipment.findOne({ _id: req.params.shipmentId, company_id: req.user.company_id });
    if (!shipment) return err(res, 'Shipment not found', 404);

    await GPSLog.create({
      shipment_id: shipment._id,
      company_id:  req.user.company_id,
      driver_id:   req.user.id,
      vehicle_number: vehicle_number || shipment.vehicle_number,
      lat, lng, speed_kmh, heading, accuracy,
    });

    await Shipment.findByIdAndUpdate(shipment._id, {
      current_lat:           lat,
      current_lng:           lng,
      current_location_name: location_name || shipment.current_location_name,
      last_gps_update:       new Date(),
    });

    ok(res, { lat, lng }, 'GPS updated');
  } catch (e) { err(res, e.message, 500); }
});

// PATCH /api/tracking/:shipmentId/status — update status + create event
router.patch('/:shipmentId/status', authenticate, async (req, res) => {
  try {
    const { status, location, description, lat, lng, vehicle_number, driver_name, driver_phone, current_hub } = req.body;
    if (!status) return err(res, 'status is required');

    const shipment = await Shipment.findOne({ _id: req.params.shipmentId, company_id: req.user.company_id });
    if (!shipment) return err(res, 'Shipment not found', 404);

    const update = { status };
    if (vehicle_number) update.vehicle_number = vehicle_number;
    if (driver_name)    update.driver_name    = driver_name;
    if (driver_phone)   update.driver_phone   = driver_phone;
    if (current_hub)    update.current_hub    = current_hub;
    if (lat)            update.current_lat    = lat;
    if (lng)            update.current_lng    = lng;
    if (location)       update.current_location_name = location;
    if (status === 'delivered') update.delivery_date = new Date();

    await Shipment.findByIdAndUpdate(shipment._id, update);

    const event = await TrackingEvent.create({
      shipment_id: shipment._id,
      company_id:  req.user.company_id,
      event_type:  status,
      location, lat, lng, description,
      event_time:  new Date(),
      created_by:  req.user.id,
    });

    await audit.log({
      company_id:   req.user.company_id,
      user:         req.user,
      action:       'UPDATE',
      resource:     'Shipment',
      resource_id:  shipment._id,
      resource_ref: shipment.lr_number,
      changes:      { status, location },
      req,
    });

    ok(res, { lr_number: shipment.lr_number, status, event_id: event._id }, 'Status updated');
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/tracking/:shipmentId/event — add tracking event
router.post('/:shipmentId/event', authenticate, async (req, res) => {
  try {
    const { event_type, location, description, event_time, lat, lng } = req.body;
    if (!event_type) return err(res, 'event_type is required');

    const shipment = await Shipment.findOne({ _id: req.params.shipmentId, company_id: req.user.company_id });
    if (!shipment) return err(res, 'Shipment not found', 404);

    const event = await TrackingEvent.create({
      shipment_id: shipment._id,
      company_id:  req.user.company_id,
      event_type, location, description, lat, lng,
      event_time:  event_time || new Date(),
      created_by:  req.user.id,
    });

    await audit.log({
      company_id:   req.user.company_id,
      user:         req.user,
      action:       'CREATE',
      resource:     'TrackingEvent',
      resource_id:  event._id,
      resource_ref: shipment.lr_number,
      changes:      { event_type, location },
      req,
    });

    ok(res, event, 'Event added', 201);
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/tracking/events/:shipmentId — full event history (auth)
router.get('/events/:shipmentId', authenticate, async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.shipmentId, company_id: req.user.company_id });
    if (!shipment) return err(res, 'Shipment not found', 404);
    const events = await TrackingEvent.find({ shipment_id: shipment._id })
      .sort({ event_time: 1 })
      .populate('created_by', 'full_name username')
      .lean();
    ok(res, { lr_number: shipment.lr_number, events });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
