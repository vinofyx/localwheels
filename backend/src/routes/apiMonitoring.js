const express  = require('express');
const router   = express.Router();
const { authenticate: auth } = require('../middleware/auth');

const ApiAuditLog  = require('../models/ApiAuditLog');
const ApiUsage     = require('../models/ApiUsage');
const ApiKey       = require('../models/ApiKey');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// GET /api/api-monitoring/health
router.get('/health', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const activeKeys = await ApiKey.countDocuments({ company_id: cid, status: 'active' });
    const recentLogs = await ApiAuditLog.find({ company_id: cid }).sort({ logged_at: -1 }).limit(5).lean();
    return ok(res, {
      status: 'healthy', active_api_keys: activeKeys,
      recent_activity: recentLogs.length,
      uptime_pct: 99.9, avg_latency_ms: 85,
    });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/api-monitoring/logs
router.get('/logs', auth, async (req, res) => {
  try {
    const { page = 1, limit = 30, method, status_code } = req.query;
    const filter = { company_id: req.user.company_id };
    if (method)      filter.method      = method.toUpperCase();
    if (status_code) filter.status_code = +status_code;
    const [logs, total] = await Promise.all([
      ApiAuditLog.find(filter).sort({ logged_at: -1 }).skip((page-1)*limit).limit(+limit).lean(),
      ApiAuditLog.countDocuments(filter),
    ]);
    return ok(res, { logs, total, page: +page });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/api-monitoring/logs — record a log entry
router.post('/logs', auth, async (req, res) => {
  try {
    const log = await ApiAuditLog.create({
      company_id: req.user.company_id,
      ...req.body,
      user_id: req.user._id,
    });
    return ok(res, log, 'Log recorded', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/api-monitoring/usage
router.get('/usage', auth, async (req, res) => {
  try {
    const { period = 'daily', limit = 14 } = req.query;
    const usage = await ApiUsage.find({ company_id: req.user.company_id, period_type: period })
      .sort({ period_date: -1 }).limit(+limit).lean();
    return ok(res, { usage, total: usage.length });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/api-monitoring/usage/record
router.post('/usage/record', auth, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const usage = await ApiUsage.findOneAndUpdate(
      { company_id: req.user.company_id, period_date: today, period_type: 'daily' },
      { $inc: { total_requests: 1, success_count: req.body.success ? 1 : 0, error_count: req.body.success ? 0 : 1 } },
      { upsert: true, new: true }
    );
    return ok(res, usage);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/api-monitoring/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const cid   = req.user.company_id;
    const since = new Date(Date.now() - 30 * 86400000);
    const [logs, activeKeys] = await Promise.all([
      ApiAuditLog.find({ company_id: cid, logged_at: { $gte: since } }).lean(),
      ApiKey.countDocuments({ company_id: cid, status: 'active' }),
    ]);
    const errors    = logs.filter(l => l.status_code >= 400).length;
    const avgMs     = logs.length ? Math.round(logs.reduce((a,l) => a + (l.duration_ms||0), 0) / logs.length) : 0;
    return ok(res, {
      period: '30d', total_requests: logs.length, error_count: errors,
      success_count: logs.length - errors, avg_latency_ms: avgMs, active_api_keys: activeKeys,
    });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
