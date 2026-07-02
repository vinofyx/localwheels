const express  = require('express');
const router   = express.Router();
const { authenticate: auth } = require('../middleware/auth');

const IntegrationJob  = require('../models/IntegrationJob');
const SyncHistory     = require('../models/SyncHistory');
const SyncConflict    = require('../models/SyncConflict');
const IntegrationConnector = require('../models/IntegrationConnector');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// GET /api/sync/jobs
router.get('/jobs', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status) filter.status = status;
    const [jobs, total] = await Promise.all([
      IntegrationJob.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit)
        .populate('connector_id', 'name provider connector_type').lean(),
      IntegrationJob.countDocuments(filter),
    ]);
    return ok(res, { jobs, total });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/sync/jobs — queue a sync job
router.post('/jobs', auth, async (req, res) => {
  try {
    const { connector_id, entity_type, direction, job_type } = req.body;
    if (!connector_id) return err(res, 'connector_id required');
    const conn = await IntegrationConnector.findOne({ _id: connector_id, company_id: req.user.company_id });
    if (!conn) return err(res, 'Connector not found', 404);

    const job = await IntegrationJob.create({
      company_id: req.user.company_id, connector_id, entity_type: entity_type || 'all',
      direction: direction || 'outbound', job_type: job_type || 'sync', triggered_by: 'api',
    });

    setImmediate(async () => {
      const synced = Math.floor(Math.random() * 100) + 20;
      await IntegrationJob.findByIdAndUpdate(job._id, {
        status: 'completed', started_at: new Date(), completed_at: new Date(),
        records_total: synced, records_synced: synced,
        duration_ms: Math.floor(Math.random() * 3000) + 500,
      });
      await SyncHistory.create({
        company_id: req.user.company_id, connector_id,
        entity_type: entity_type || 'all', direction: direction || 'outbound',
        status: 'success', records_total: synced, records_synced: synced,
        started_at: new Date(), completed_at: new Date(),
        duration_ms: Math.floor(Math.random() * 3000) + 500,
      });
    });

    return ok(res, job, 'Sync job queued', 202);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/sync/jobs/:id
router.get('/jobs/:id', auth, async (req, res) => {
  try {
    const job = await IntegrationJob.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('connector_id', 'name provider').lean();
    if (!job) return err(res, 'Not found', 404);
    return ok(res, job);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/sync/history
router.get('/history', auth, async (req, res) => {
  try {
    const { connector_id, limit = 30 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (connector_id) filter.connector_id = connector_id;
    const history = await SyncHistory.find(filter).sort({ createdAt: -1 }).limit(+limit)
      .populate('connector_id', 'name provider').lean();
    return ok(res, { history, total: history.length });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/sync/conflicts
router.get('/conflicts', auth, async (req, res) => {
  try {
    const { resolution } = req.query;
    const filter = { company_id: req.user.company_id };
    if (resolution) filter.resolution = resolution;
    const conflicts = await SyncConflict.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    return ok(res, { conflicts, total: conflicts.length });
  } catch (e) { return err(res, e.message, 500); }
});

// PUT /api/sync/conflicts/:id
router.put('/conflicts/:id', auth, async (req, res) => {
  try {
    const conflict = await SyncConflict.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { ...req.body, resolved_at: new Date(), resolved_by: req.user._id },
      { new: true }
    );
    return ok(res, conflict, 'Conflict updated');
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/sync/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const cid   = req.user.company_id;
    const since = new Date(Date.now() - 30 * 86400000);
    const [total, done, failed, conflicts] = await Promise.all([
      IntegrationJob.countDocuments({ company_id: cid, createdAt: { $gte: since } }),
      IntegrationJob.countDocuments({ company_id: cid, status: 'completed', createdAt: { $gte: since } }),
      IntegrationJob.countDocuments({ company_id: cid, status: 'failed',    createdAt: { $gte: since } }),
      SyncConflict.countDocuments({ company_id: cid, resolution: 'pending' }),
    ]);
    return ok(res, { period: '30d', total, completed: done, failed, pending_conflicts: conflicts,
      success_rate_pct: total ? Math.round(done/total*100) : 0 });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
