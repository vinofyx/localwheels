const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate: auth } = require('../middleware/auth');

const ApiAnalytics         = require('../models/ApiAnalytics');
const ApiAuditLog          = require('../models/ApiAuditLog');
const IntegrationConnector = require('../models/IntegrationConnector');
const IntegrationJob       = require('../models/IntegrationJob');
const Webhook              = require('../models/Webhook');
const WebhookDelivery      = require('../models/WebhookDelivery');
const EventBus             = require('../models/EventBus');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });
const ObjId = mongoose.Types.ObjectId;

// GET /api/integration-analytics/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const cid     = req.user.company_id;
    const since30 = new Date(Date.now() - 30 * 86400000);
    const since7  = new Date(Date.now() -  7 * 86400000);

    const [
      connActive, jobTotal30, jobDone30, jobFail30,
      jobTotal7, jobDone7,
      whTotal, whActive, dlTotal30, dlSuccess30,
      evTotal30, evDelivered30,
    ] = await Promise.all([
      IntegrationConnector.countDocuments({ company_id: cid, status: 'active' }),
      IntegrationJob.countDocuments({ company_id: cid, createdAt: { $gte: since30 } }),
      IntegrationJob.countDocuments({ company_id: cid, status: 'completed', createdAt: { $gte: since30 } }),
      IntegrationJob.countDocuments({ company_id: cid, status: 'failed',    createdAt: { $gte: since30 } }),
      IntegrationJob.countDocuments({ company_id: cid, createdAt: { $gte: since7 } }),
      IntegrationJob.countDocuments({ company_id: cid, status: 'completed', createdAt: { $gte: since7 } }),
      Webhook.countDocuments({ company_id: cid }),
      Webhook.countDocuments({ company_id: cid, status: 'active' }),
      WebhookDelivery.countDocuments({ company_id: cid, createdAt: { $gte: since30 } }),
      WebhookDelivery.countDocuments({ company_id: cid, status: 'delivered', createdAt: { $gte: since30 } }),
      EventBus.countDocuments({ company_id: cid, createdAt: { $gte: since30 } }),
      EventBus.countDocuments({ company_id: cid, status: 'delivered', createdAt: { $gte: since30 } }),
    ]);

    return ok(res, {
      connectors:  { active: connActive },
      sync_jobs: {
        last_30_days: { total: jobTotal30, completed: jobDone30, failed: jobFail30,
          success_rate_pct: jobTotal30 ? Math.round(jobDone30/jobTotal30*100) : 0 },
        last_7_days:  { total: jobTotal7, completed: jobDone7,
          success_rate_pct: jobTotal7 ? Math.round(jobDone7/jobTotal7*100) : 0 },
      },
      webhooks: { total: whTotal, active: whActive,
        deliveries_30d: dlTotal30, delivery_success_rate: dlTotal30 ? Math.round(dlSuccess30/dlTotal30*100) : 0 },
      events: { published_30d: evTotal30, delivered_30d: evDelivered30,
        delivery_rate: evTotal30 ? Math.round(evDelivered30/evTotal30*100) : 0 },
    });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/integration-analytics/history
router.get('/history', auth, async (req, res) => {
  try {
    const { period = 'daily', limit = 14 } = req.query;
    const history = await ApiAnalytics.find({ company_id: req.user.company_id, period_type: period })
      .sort({ period_date: -1 }).limit(+limit).lean();
    return ok(res, { history });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/integration-analytics/snapshot
router.post('/snapshot', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const { period = 'daily' } = req.body;
    const since = new Date(Date.now() - 86400000);
    const [total, done, fail, wh_del, wh_ok, ev_pub, ev_del] = await Promise.all([
      IntegrationJob.countDocuments({ company_id: cid, createdAt: { $gte: since } }),
      IntegrationJob.countDocuments({ company_id: cid, status: 'completed', createdAt: { $gte: since } }),
      IntegrationJob.countDocuments({ company_id: cid, status: 'failed',    createdAt: { $gte: since } }),
      WebhookDelivery.countDocuments({ company_id: cid, createdAt: { $gte: since } }),
      WebhookDelivery.countDocuments({ company_id: cid, status: 'delivered', createdAt: { $gte: since } }),
      EventBus.countDocuments({ company_id: cid, createdAt: { $gte: since } }),
      EventBus.countDocuments({ company_id: cid, status: 'delivered', createdAt: { $gte: since } }),
    ]);
    const connActive = await IntegrationConnector.countDocuments({ company_id: cid, status: 'active' });

    const today = new Date(); today.setHours(0,0,0,0);
    const snap  = await ApiAnalytics.findOneAndUpdate(
      { company_id: cid, period_date: today, period_type: period },
      { sync_jobs_total: total, sync_jobs_success: done,
        webhook_deliveries: wh_del, webhook_successes: wh_ok, webhook_failures: wh_del - wh_ok,
        events_published: ev_pub, events_delivered: ev_del,
        connectors_active: connActive,
        failed_calls: fail },
      { upsert: true, new: true }
    );
    return ok(res, snap, 'Snapshot saved');
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/integration-analytics/ai-insights
router.post('/ai-insights', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [connectors, jobs, alerts] = await Promise.all([
      IntegrationConnector.find({ company_id: cid }).select('name provider status last_sync_status health_score').lean(),
      IntegrationJob.find({ company_id: cid }).sort({ createdAt: -1 }).limit(20).lean(),
      Webhook.find({ company_id: cid }).select('name status failure_deliveries').lean(),
    ]);

    const client  = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are an enterprise integration analyst. Analyze:
Connectors: ${JSON.stringify(connectors.slice(0,5))}
Recent Jobs: ${JSON.stringify(jobs.slice(0,5))}
Webhooks: ${JSON.stringify(alerts.slice(0,5))}
Return JSON array of 3 insights: [{"insight":"...","recommendation":"...","priority":"high|medium|low"}]
Return ONLY valid JSON, no markdown.`,
      }],
    });

    let insights = [];
    try { insights = JSON.parse(message.content[0].text); } catch { insights = []; }
    return ok(res, { insights });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
