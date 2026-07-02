const router  = require('express').Router();
const { authenticate: auth } = require('../middleware/auth');
const DigitalWorker = require('../models/DigitalWorker');
const AutomationJob = require('../models/AutomationJob');

const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.get('/', auth, async (req, res) => {
  try {
    const workers = await DigitalWorker.find({ company_id: req.user.company_id })
      .sort({ createdAt: -1 }).lean();
    ok(res, { workers, total: workers.length });
  } catch (e) { err(res, e.message, 500); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const worker = await DigitalWorker.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!worker) return err(res, 'Worker not found', 404);
    const recentJobs = await AutomationJob.find({ company_id: req.user.company_id, workflow_id: { $in: worker.assigned_workflows } })
      .sort({ createdAt: -1 }).limit(10).lean();
    ok(res, { worker, recent_jobs: recentJobs });
  } catch (e) { err(res, e.message, 500); }
});

router.post('/', auth, async (req, res) => {
  try {
    const worker = await DigitalWorker.create({ ...req.body, company_id: req.user.company_id, created_by: req.user.id });
    ok(res, worker, 'Digital worker created', 201);
  } catch (e) { err(res, e.message); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const worker = await DigitalWorker.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: req.body }, { new: true }
    );
    if (!worker) return err(res, 'Not found', 404);
    ok(res, worker, 'Worker updated');
  } catch (e) { err(res, e.message); }
});

router.post('/:id/activate', auth, async (req, res) => {
  try {
    const worker = await DigitalWorker.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { is_active: true, current_status: 'idle', last_active_at: new Date() } },
      { new: true }
    );
    if (!worker) return err(res, 'Not found', 404);
    ok(res, worker, 'Worker activated');
  } catch (e) { err(res, e.message); }
});

router.post('/:id/deactivate', auth, async (req, res) => {
  try {
    const worker = await DigitalWorker.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { is_active: false, current_status: 'offline' } },
      { new: true }
    );
    if (!worker) return err(res, 'Not found', 404);
    ok(res, worker, 'Worker deactivated');
  } catch (e) { err(res, e.message); }
});

router.get('/stats/overview', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const workers = await DigitalWorker.find({ company_id: cid }).lean();
    const active  = workers.filter(w => w.is_active).length;
    const running = workers.filter(w => w.current_status === 'running').length;
    const totalTasks = workers.reduce((s, w) => s + (w.tasks_completed || 0), 0);
    ok(res, { total: workers.length, active, running, total_tasks_completed: totalTasks, workers });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
