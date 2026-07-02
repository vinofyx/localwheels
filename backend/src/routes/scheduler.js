const router  = require('express').Router();
const { authenticate: auth } = require('../middleware/auth');
const EnterpriseScheduler = require('../models/EnterpriseScheduler');
const AutomationJob       = require('../models/AutomationJob');
const AutomationWorkflow  = require('../models/AutomationWorkflow');

const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

function calcNextRun(sched) {
  const now = new Date();
  switch (sched.schedule_type) {
    case 'hourly':  return new Date(now.getTime() + 60 * 60 * 1000);
    case 'daily':   return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:        return null;
  }
}

router.get('/', auth, async (req, res) => {
  try {
    const { is_active, limit = 20, page = 1 } = req.query;
    const cid = req.user.company_id;
    const filter = { company_id: cid };
    if (is_active !== undefined) filter.is_active = is_active === 'true';
    const skip = (page - 1) * limit;
    const [schedules, total] = await Promise.all([
      EnterpriseScheduler.find(filter).sort({ next_run_at: 1 }).skip(skip).limit(+limit)
        .populate('workflow_id', 'name category').lean(),
      EnterpriseScheduler.countDocuments(filter),
    ]);
    ok(res, { schedules, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (e) { err(res, e.message, 500); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const sched = await EnterpriseScheduler.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('workflow_id', 'name category run_count success_count').lean();
    if (!sched) return err(res, 'Schedule not found', 404);
    ok(res, { schedule: sched });
  } catch (e) { err(res, e.message, 500); }
});

router.post('/', auth, async (req, res) => {
  try {
    const data = { ...req.body, company_id: req.user.company_id, created_by: req.user.id };
    const sched = new EnterpriseScheduler(data);
    sched.next_run_at = calcNextRun(sched);
    await sched.save();
    ok(res, sched, 'Schedule created', 201);
  } catch (e) { err(res, e.message); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const sched = await EnterpriseScheduler.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: req.body }, { new: true }
    );
    if (!sched) return err(res, 'Not found', 404);
    ok(res, sched, 'Schedule updated');
  } catch (e) { err(res, e.message); }
});

router.post('/:id/run-now', auth, async (req, res) => {
  try {
    const sched = await EnterpriseScheduler.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!sched) return err(res, 'Not found', 404);

    let job = null;
    if (sched.workflow_id) {
      const wf = await AutomationWorkflow.findById(sched.workflow_id);
      if (wf) {
        job = await AutomationJob.create({
          company_id: req.user.company_id, workflow_id: wf._id, workflow_name: wf.name,
          trigger_type: 'schedule', triggered_by: req.user.id,
          steps_total: wf.steps.length, status: 'queued',
        });
      }
    }

    sched.last_run_at = new Date();
    sched.run_count   = (sched.run_count || 0) + 1;
    sched.next_run_at = calcNextRun(sched);
    sched.last_status = 'success';
    await sched.save();

    ok(res, { schedule: sched, job }, 'Schedule triggered');
  } catch (e) { err(res, e.message, 500); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await EnterpriseScheduler.findOneAndDelete({ _id: req.params.id, company_id: req.user.company_id });
    ok(res, null, 'Schedule deleted');
  } catch (e) { err(res, e.message, 500); }
});

router.get('/stats/overview', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [total, active, dueNow] = await Promise.all([
      EnterpriseScheduler.countDocuments({ company_id: cid }),
      EnterpriseScheduler.countDocuments({ company_id: cid, is_active: true }),
      EnterpriseScheduler.countDocuments({ company_id: cid, is_active: true, next_run_at: { $lte: new Date(Date.now() + 60 * 60 * 1000) } }),
    ]);
    const upcoming = await EnterpriseScheduler.find({ company_id: cid, is_active: true })
      .sort({ next_run_at: 1 }).limit(5).lean();
    ok(res, { total, active, due_in_hour: dueNow, upcoming });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
