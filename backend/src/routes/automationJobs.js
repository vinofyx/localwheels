const router  = require('express').Router();
const { authenticate: auth } = require('../middleware/auth');
const AutomationJob      = require('../models/AutomationJob');
const AutomationExecution = require('../models/AutomationExecution');

const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.get('/', auth, async (req, res) => {
  try {
    const { status, workflow_id, limit = 20, page = 1 } = req.query;
    const cid = req.user.company_id;
    const filter = { company_id: cid };
    if (status)      filter.status      = status;
    if (workflow_id) filter.workflow_id = workflow_id;
    const skip = (page - 1) * limit;
    const [jobs, total] = await Promise.all([
      AutomationJob.find(filter).sort({ createdAt: -1 }).skip(skip).limit(+limit)
        .populate('triggered_by', 'name').lean(),
      AutomationJob.countDocuments(filter),
    ]);
    ok(res, { jobs, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (e) { err(res, e.message, 500); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const job = await AutomationJob.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('triggered_by', 'name').lean();
    if (!job) return err(res, 'Job not found', 404);
    const executions = await AutomationExecution.find({ job_id: job._id }).sort({ step_number: 1 }).lean();
    ok(res, { job, executions });
  } catch (e) { err(res, e.message, 500); }
});

router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const job = await AutomationJob.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!job) return err(res, 'Job not found', 404);
    if (!['queued','running'].includes(job.status)) return err(res, 'Cannot cancel job in current state');
    job.status = 'cancelled';
    await job.save();
    ok(res, job, 'Job cancelled');
  } catch (e) { err(res, e.message, 500); }
});

router.get('/stats/summary', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [total, completed, failed, running, queued] = await Promise.all([
      AutomationJob.countDocuments({ company_id: cid, createdAt: { $gte: since } }),
      AutomationJob.countDocuments({ company_id: cid, status: 'completed', createdAt: { $gte: since } }),
      AutomationJob.countDocuments({ company_id: cid, status: 'failed',    createdAt: { $gte: since } }),
      AutomationJob.countDocuments({ company_id: cid, status: 'running' }),
      AutomationJob.countDocuments({ company_id: cid, status: 'queued'  }),
    ]);
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    ok(res, { total, completed, failed, running, queued, success_rate_pct: successRate });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
