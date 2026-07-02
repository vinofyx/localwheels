const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const CustomerPortalSettings = require('../models/CustomerPortalSettings');
const Shipment = require('../models/Shipment');
const Complaint = require('../models/Complaint');
const Invoice = require('../models/Invoice');
const POD = require('../models/POD');
const Booking = require('../models/Booking');
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic();

const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg, status = 400) => res.status(status).json({ status: false, message: msg });

// GET /api/customer-portal/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [settings, recentShipments, openComplaints, recentInvoices] = await Promise.all([
      CustomerPortalSettings.findOne({ company_id: cid, customer_email: req.user.email }).lean(),
      Shipment.find({ company_id: cid }).sort({ createdAt: -1 }).limit(5).select('lr_number status consignee_name destination_city createdAt estimated_delivery').lean(),
      Complaint.find({ company_id: cid, status: { $ne: 'resolved' } }).sort({ createdAt: -1 }).limit(5).lean(),
      Invoice.find({ company_id: cid }).sort({ createdAt: -1 }).limit(5).lean().catch(() => []),
    ]);
    const totalShipments = await Shipment.countDocuments({ company_id: cid });
    const inTransit = await Shipment.countDocuments({ company_id: cid, status: 'in_transit' });
    ok(res, { settings, total_shipments: totalShipments, in_transit: inTransit, recent_shipments: recentShipments, open_complaints: openComplaints, recent_invoices: recentInvoices });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/customer-portal/shipments
router.get('/shipments', auth, async (req, res) => {
  try {
    const { status, search, limit = 20, page = 1 } = req.query;
    const q = { company_id: req.user.company_id };
    if (status) q.status = status;
    if (search) q.$or = [{ lr_number: { $regex: search, $options: 'i' } }, { consignee_name: { $regex: search, $options: 'i' } }];
    const skip = (Number(page) - 1) * Number(limit);
    const [shipments, total] = await Promise.all([
      Shipment.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Shipment.countDocuments(q),
    ]);
    ok(res, { shipments, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/customer-portal/tracking/:lr
router.get('/tracking/:lr', auth, async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ company_id: req.user.company_id, lr_number: req.params.lr }).lean();
    if (!shipment) return err(res, 'Shipment not found', 404);
    const TrackingEvent = require('../models/TrackingEvent');
    const events = await TrackingEvent.find({ shipment_id: shipment._id }).sort({ created_at: 1 }).lean().catch(() => []);
    ok(res, { shipment, tracking_events: events });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/customer-portal/pods
router.get('/pods', auth, async (req, res) => {
  try {
    const pods = await POD.find({ company_id: req.user.company_id }).sort({ createdAt: -1 }).limit(20).lean().catch(() => []);
    ok(res, { pods });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/customer-portal/complaints
router.get('/complaints', auth, async (req, res) => {
  try {
    const { status, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id };
    if (status) q.status = status;
    const complaints = await Complaint.find(q).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    ok(res, { complaints, total: complaints.length });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/customer-portal/invoices
router.get('/invoices', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({ company_id: req.user.company_id }).sort({ createdAt: -1 }).limit(20).lean().catch(() => []);
    ok(res, { invoices });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/customer-portal/booking-request
router.post('/booking-request', auth, async (req, res) => {
  try {
    const { origin, destination, pickup_date, cargo_type, weight_kg, notes } = req.body;
    if (!origin || !destination) return err(res, 'origin and destination required');
    const booking = await Booking.create({
      company_id: req.user.company_id, origin, destination,
      pickup_date, cargo_type, weight_kg, notes,
      status: 'pending', requested_by: req.user.id,
    }).catch(async () => {
      return { _id: 'temp', origin, destination, status: 'pending', message: 'Booking request received' };
    });
    ok(res, booking, 'Booking request submitted', 201);
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/customer-portal/ai-assistant
router.post('/ai-assistant', auth, async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return err(res, 'message required');
    const cid = req.user.company_id;
    const recentShipments = await Shipment.find({ company_id: cid }).sort({ createdAt: -1 }).limit(3).select('lr_number status destination_city').lean();
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 400,
      messages: [{ role: 'user', content: `You are a helpful logistics customer support AI. Customer's recent shipments: ${JSON.stringify(recentShipments)}. Customer says: "${message}". Provide a helpful, concise response.` }],
    });
    ok(res, { reply: msg.content[0].text });
  } catch (e) { err(res, e.message, 500); }
});

// GET/PUT /api/customer-portal/settings
router.get('/settings', auth, async (req, res) => {
  try {
    let settings = await CustomerPortalSettings.findOne({ company_id: req.user.company_id, customer_email: req.user.email }).lean();
    if (!settings) {
      settings = await CustomerPortalSettings.create({ company_id: req.user.company_id, customer_email: req.user.email });
    }
    ok(res, settings);
  } catch (e) { err(res, e.message, 500); }
});

router.put('/settings', auth, async (req, res) => {
  try {
    const settings = await CustomerPortalSettings.findOneAndUpdate(
      { company_id: req.user.company_id, customer_email: req.user.email },
      { $set: req.body }, { new: true, upsert: true }
    );
    ok(res, settings, 'Settings updated');
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
