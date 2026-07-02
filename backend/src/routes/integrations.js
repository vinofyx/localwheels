const express  = require('express');
const router   = express.Router();
const { authenticate: auth } = require('../middleware/auth');

const IntegrationConnector = require('../models/IntegrationConnector');
const IntegrationJob       = require('../models/IntegrationJob');
const SyncHistory          = require('../models/SyncHistory');
const IntegrationAlert     = require('../models/IntegrationAlert');
const ExternalSystem       = require('../models/ExternalSystem');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// GET /api/integrations/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [
      connTotal, connActive, connError,
      jobsTotal, jobsSuccess, jobsFailed,
      alertsOpen,
    ] = await Promise.all([
      IntegrationConnector.countDocuments({ company_id: cid }),
      IntegrationConnector.countDocuments({ company_id: cid, status: 'active' }),
      IntegrationConnector.countDocuments({ company_id: cid, status: 'error' }),
      IntegrationJob.countDocuments({ company_id: cid }),
      IntegrationJob.countDocuments({ company_id: cid, status: 'completed' }),
      IntegrationJob.countDocuments({ company_id: cid, status: 'failed' }),
      IntegrationAlert.countDocuments({ company_id: cid, status: 'open' }),
    ]);

    const recentJobs = await IntegrationJob.find({ company_id: cid })
      .sort({ createdAt: -1 }).limit(5)
      .populate('connector_id', 'name provider').lean();

    const recentAlerts = await IntegrationAlert.find({ company_id: cid, status: 'open' })
      .sort({ createdAt: -1 }).limit(5).lean();

    return ok(res, {
      connectors:  { total: connTotal, active: connActive, error: connError },
      jobs:        { total: jobsTotal, completed: jobsSuccess, failed: jobsFailed,
                     success_rate_pct: jobsTotal ? Math.round(jobsSuccess/jobsTotal*100) : 0 },
      alerts_open: alertsOpen,
      recent_jobs: recentJobs,
      recent_alerts: recentAlerts,
    });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/integrations/jobs
router.get('/jobs', auth, async (req, res) => {
  try {
    const { status, connector_id, page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status)       filter.status = status;
    if (connector_id) filter.connector_id = connector_id;
    const [jobs, total] = await Promise.all([
      IntegrationJob.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit)
        .populate('connector_id', 'name provider connector_type').lean(),
      IntegrationJob.countDocuments(filter),
    ]);
    return ok(res, { jobs, total, page: +page });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/integrations/alerts
router.get('/alerts', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status) filter.status = status;
    const alerts = await IntegrationAlert.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    return ok(res, { alerts, total: alerts.length });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/integrations/alerts
router.post('/alerts', auth, async (req, res) => {
  try {
    const { alert_type, severity, title, message, connector_id } = req.body;
    if (!alert_type || !title) return err(res, 'alert_type and title required');
    const alert = await IntegrationAlert.create({
      company_id: req.user.company_id, alert_type, severity, title, message, connector_id,
    });
    return ok(res, alert, 'Alert created', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// PUT /api/integrations/alerts/:id/acknowledge
router.put('/alerts/:id/acknowledge', auth, async (req, res) => {
  try {
    const alert = await IntegrationAlert.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { status: 'acknowledged', acknowledged_at: new Date() }, { new: true }
    );
    return ok(res, alert, 'Alert acknowledged');
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/integrations/external-systems
router.get('/external-systems', auth, async (req, res) => {
  try {
    const systems = await ExternalSystem.find({ company_id: req.user.company_id }).lean();
    return ok(res, { systems, total: systems.length });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/integrations/external-systems
router.post('/external-systems', auth, async (req, res) => {
  try {
    const sys = await ExternalSystem.create({ company_id: req.user.company_id, ...req.body });
    return ok(res, sys, 'External system registered', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/integrations/sync-history
router.get('/sync-history', auth, async (req, res) => {
  try {
    const { connector_id, limit = 30 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (connector_id) filter.connector_id = connector_id;
    const history = await SyncHistory.find(filter).sort({ createdAt: -1 }).limit(+limit)
      .populate('connector_id', 'name provider').lean();
    return ok(res, { history, total: history.length });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
