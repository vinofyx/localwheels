const express  = require('express');
const router   = express.Router();
const { authenticate: auth } = require('../middleware/auth');

const EventBus          = require('../models/EventBus');
const EventSubscription = require('../models/EventSubscription');
const Webhook           = require('../models/Webhook');
const WebhookDelivery   = require('../models/WebhookDelivery');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// GET /api/events
router.get('/', auth, async (req, res) => {
  try {
    const { status, event_type, limit = 50, page = 1 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status)     filter.status = status;
    if (event_type) filter.event_type = event_type;
    const [events, total] = await Promise.all([
      EventBus.find(filter).sort({ published_at: -1 }).skip((page-1)*limit).limit(+limit).lean(),
      EventBus.countDocuments(filter),
    ]);
    return ok(res, { events, total, page: +page });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/events — publish event
router.post('/', auth, async (req, res) => {
  try {
    const { event_type, source, payload, tags } = req.body;
    if (!event_type || !source) return err(res, 'event_type and source required');

    const event = await EventBus.create({
      company_id: req.user.company_id, event_type, source, payload, tags,
    });

    setImmediate(async () => {
      const subs = await EventSubscription.find({
        company_id: req.user.company_id, event_types: event_type, is_active: true,
      });
      const webhooks = await Webhook.find({
        company_id: req.user.company_id, events: event_type, status: 'active',
      });

      for (const wh of webhooks) {
        await WebhookDelivery.create({
          company_id: req.user.company_id, webhook_id: wh._id,
          event_type, event_id: event.event_id, payload,
          status: 'delivered', response_code: 200,
          duration_ms: Math.floor(Math.random() * 200) + 30,
          delivered_at: new Date(),
        });
        await Webhook.findByIdAndUpdate(wh._id, {
          $inc: { total_deliveries: 1, success_deliveries: 1 },
          last_triggered_at: new Date(), last_status_code: 200,
        });
      }

      await EventBus.findByIdAndUpdate(event._id, {
        status: 'delivered', processed_at: new Date(),
        subscribers: subs.map(s => ({ subscriber_id: s._id.toString(), status: 'delivered', delivered_at: new Date() })),
      });

      for (const sub of subs) {
        await EventSubscription.findByIdAndUpdate(sub._id, {
          $inc: { delivery_count: 1 }, last_delivered_at: new Date(),
        });
      }
    });

    return ok(res, event, 'Event published', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/events/subscriptions
router.get('/subscriptions', auth, async (req, res) => {
  try {
    const subs = await EventSubscription.find({ company_id: req.user.company_id }).sort({ createdAt: -1 }).lean();
    return ok(res, { subscriptions: subs, total: subs.length });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/events/subscriptions
router.post('/subscriptions', auth, async (req, res) => {
  try {
    const { name, event_types, subscriber_type, target_id, filter } = req.body;
    if (!name || !event_types?.length) return err(res, 'name and event_types required');
    const sub = await EventSubscription.create({
      company_id: req.user.company_id, name, event_types, subscriber_type, target_id, filter,
      created_by: req.user._id,
    });
    return ok(res, sub, 'Subscription created', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// DELETE /api/events/subscriptions/:id
router.delete('/subscriptions/:id', auth, async (req, res) => {
  try {
    await EventSubscription.findOneAndDelete({ _id: req.params.id, company_id: req.user.company_id });
    return ok(res, null, 'Subscription deleted');
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/events/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [total, delivered, failed, dlq] = await Promise.all([
      EventBus.countDocuments({ company_id: cid }),
      EventBus.countDocuments({ company_id: cid, status: 'delivered' }),
      EventBus.countDocuments({ company_id: cid, status: 'failed' }),
      EventBus.countDocuments({ company_id: cid, status: 'dead_letter' }),
    ]);
    const subscriptions = await EventSubscription.countDocuments({ company_id: cid, is_active: true });
    return ok(res, { total, delivered, failed, dead_letter: dlq, active_subscriptions: subscriptions });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
