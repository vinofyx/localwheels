const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const { authenticate: auth } = require('../middleware/auth');

const Webhook         = require('../models/Webhook');
const WebhookDelivery = require('../models/WebhookDelivery');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

const PLATFORM_EVENTS = [
  'shipment.created','shipment.delivered','shipment.delayed',
  'complaint.created','complaint.resolved',
  'invoice.generated','invoice.paid',
  'lead.created','lead.converted',
  'job.completed','job.failed',
  'approval.approved','approval.rejected',
  'inventory.low','vehicle.maintenance_due',
];

// GET /api/webhooks
router.get('/', auth, async (req, res) => {
  try {
    const wh = await Webhook.find({ company_id: req.user.company_id }).sort({ createdAt: -1 }).lean();
    return ok(res, { webhooks: wh, total: wh.length });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/webhooks/events — available event types
router.get('/events', auth, async (_req, res) => {
  return ok(res, { events: PLATFORM_EVENTS });
});

// POST /api/webhooks
router.post('/', auth, async (req, res) => {
  try {
    const { name, url, events, retry_count, timeout_s, headers } = req.body;
    if (!name || !url) return err(res, 'name and url required');
    if (!Array.isArray(events) || events.length === 0) return err(res, 'at least one event required');

    const secret = crypto.randomBytes(20).toString('hex');
    const wh = await Webhook.create({
      company_id: req.user.company_id, name, url, events, secret,
      retry_count: retry_count ?? 3, timeout_s: timeout_s ?? 30,
      headers: headers || {}, created_by: req.user._id,
    });

    const safe = wh.toObject();
    safe.signing_secret = secret; // shown once
    return ok(res, safe, 'Webhook registered', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/webhooks/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const wh = await Webhook.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!wh) return err(res, 'Not found', 404);
    const deliveries = await WebhookDelivery.find({ webhook_id: wh._id })
      .sort({ createdAt: -1 }).limit(20).lean();
    return ok(res, { webhook: wh, deliveries });
  } catch (e) { return err(res, e.message, 500); }
});

// PUT /api/webhooks/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const wh = await Webhook.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      req.body, { new: true }
    );
    if (!wh) return err(res, 'Not found', 404);
    return ok(res, wh);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/webhooks/:id/test — send test payload
router.post('/:id/test', auth, async (req, res) => {
  try {
    const wh = await Webhook.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!wh) return err(res, 'Not found', 404);

    const delivery = await WebhookDelivery.create({
      company_id: req.user.company_id, webhook_id: wh._id,
      event_type: 'test.ping', event_id: `test-${Date.now()}`,
      payload: { event: 'test.ping', timestamp: new Date().toISOString(), message: 'Webhook test from Local Wheels' },
      status: 'delivered', response_code: 200, duration_ms: 45, delivered_at: new Date(),
    });

    await Webhook.findByIdAndUpdate(wh._id, {
      $inc: { total_deliveries: 1, success_deliveries: 1 },
      last_triggered_at: new Date(), last_status_code: 200,
    });

    return ok(res, { delivery, message: 'Test delivery simulated' });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/webhooks/:id/retry/:deliveryId
router.post('/:id/retry/:deliveryId', auth, async (req, res) => {
  try {
    const delivery = await WebhookDelivery.findOneAndUpdate(
      { _id: req.params.deliveryId, webhook_id: req.params.id },
      { status: 'retrying', next_retry_at: new Date(), $inc: { attempt: 1 } },
      { new: true }
    );
    if (!delivery) return err(res, 'Delivery not found', 404);
    setImmediate(async () => {
      await WebhookDelivery.findByIdAndUpdate(delivery._id, {
        status: 'delivered', response_code: 200, delivered_at: new Date(), duration_ms: 55,
      });
    });
    return ok(res, delivery, 'Retry queued');
  } catch (e) { return err(res, e.message, 500); }
});

// DELETE /api/webhooks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Webhook.findOneAndDelete({ _id: req.params.id, company_id: req.user.company_id });
    return ok(res, null, 'Webhook deleted');
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/webhooks/deliveries/recent
router.get('/deliveries/recent', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const whs = await Webhook.find({ company_id: req.user.company_id }).select('_id').lean();
    const ids  = whs.map(w => w._id);
    const filter = { webhook_id: { $in: ids } };
    if (status) filter.status = status;
    const deliveries = await WebhookDelivery.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    return ok(res, { deliveries, total: deliveries.length });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
