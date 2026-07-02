const express = require('express');
const router  = express.Router();
const { authenticate: auth } = require('../middleware/auth');

const BusinessContinuity = require('../models/BusinessContinuity');
const RecoveryPlan       = require('../models/RecoveryPlan');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// GET /api/recovery/plans
router.get('/plans', auth, async (req, res) => {
  try {
    const { scenario_type, status } = req.query;
    const filter = { company_id: req.user.company_id };
    if (scenario_type) filter.scenario_type = scenario_type;
    if (status)        filter.status        = status;
    const plans = await BusinessContinuity.find(filter).sort({ priority: 1, createdAt: -1 }).lean();
    return ok(res, { plans, total: plans.length });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/recovery/plans
router.post('/plans', auth, async (req, res) => {
  try {
    const { plan_name, scenario_type, rto_hours, rpo_hours, priority, affected_systems, recovery_steps } = req.body;
    if (!plan_name || !scenario_type) return err(res, 'plan_name and scenario_type required');
    const defaultSteps = [
      { step_no: 1, title: 'Incident Detection & Assessment', description: 'Identify impact scope and severity', owner: 'Operations Manager', duration_hrs: 1 },
      { step_no: 2, title: 'Stakeholder Notification', description: 'Alert key stakeholders and activate crisis team', owner: 'Communications Lead', duration_hrs: 1 },
      { step_no: 3, title: 'Activate Recovery Resources', description: 'Deploy backup resources and alternate routes', owner: 'Fleet Manager', duration_hrs: 2 },
      { step_no: 4, title: 'Service Restoration', description: 'Restore critical services to minimum viable state', owner: 'Operations Lead', duration_hrs: 4 },
      { step_no: 5, title: 'Full Recovery & Review', description: 'Complete recovery and conduct post-incident review', owner: 'Director', duration_hrs: 24 },
    ];
    const plan = await BusinessContinuity.create({
      company_id: req.user.company_id, plan_name, scenario_type, rto_hours: rto_hours || 24,
      rpo_hours: rpo_hours || 4, priority: priority || 'high',
      affected_systems: affected_systems || [],
      recovery_steps: recovery_steps || defaultSteps,
      review_date: new Date(Date.now() + 90 * 86400000),
      created_by: req.user._id,
    });
    return ok(res, plan, 'Business continuity plan created', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/recovery/plans/:id
router.get('/plans/:id', auth, async (req, res) => {
  try {
    const plan = await BusinessContinuity.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!plan) return err(res, 'Not found', 404);
    const executions = await RecoveryPlan.find({ bcp_id: plan._id }).lean();
    return ok(res, { plan, executions });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/recovery/plans/:id/activate
router.post('/plans/:id/activate', auth, async (req, res) => {
  try {
    const plan = await BusinessContinuity.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!plan) return err(res, 'Not found', 404);
    const exec = await RecoveryPlan.create({
      company_id: req.user.company_id, bcp_id: plan._id,
      title: `${plan.plan_name} — Activation ${new Date().toLocaleDateString()}`,
      incident_type: plan.scenario_type, severity: plan.priority,
      status: 'activated', activated_at: new Date(),
      rto_target_hours: plan.rto_hours,
      affected_operations: plan.affected_systems,
      checkpoints: plan.recovery_steps.map(s => ({ title: s.title, status: 'pending' })),
      created_by: req.user._id,
    });
    await BusinessContinuity.findByIdAndUpdate(plan._id, { status: 'active' });
    return ok(res, exec, 'Recovery plan activated');
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/recovery/plans/:id/test
router.post('/plans/:id/test', auth, async (req, res) => {
  try {
    const plan = await BusinessContinuity.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { last_tested_at: new Date(), test_result: req.body.result || 'pass', status: 'tested' },
      { new: true }
    );
    return ok(res, plan, 'Test result recorded');
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/recovery/executions
router.get('/executions', auth, async (req, res) => {
  try {
    const execs = await RecoveryPlan.find({ company_id: req.user.company_id })
      .sort({ createdAt: -1 }).lean();
    return ok(res, { executions: execs, total: execs.length });
  } catch (e) { return err(res, e.message, 500); }
});

// PUT /api/recovery/executions/:id/checkpoint
router.put('/executions/:id/checkpoint', auth, async (req, res) => {
  try {
    const { index, status, notes } = req.body;
    const exec = await RecoveryPlan.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!exec) return err(res, 'Not found', 404);
    if (exec.checkpoints[index]) {
      exec.checkpoints[index].status      = status || 'completed';
      exec.checkpoints[index].notes       = notes;
      exec.checkpoints[index].completed_at = new Date();
    }
    exec.markModified('checkpoints');
    await exec.save();
    return ok(res, exec, 'Checkpoint updated');
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/recovery/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [plans, tested, active] = await Promise.all([
      BusinessContinuity.countDocuments({ company_id: cid }),
      BusinessContinuity.countDocuments({ company_id: cid, status: 'tested' }),
      RecoveryPlan.countDocuments({ company_id: cid, status: { $in: ['activated','executing'] } }),
    ]);
    return ok(res, { total_plans: plans, tested, active_recoveries: active,
      coverage_pct: plans ? Math.round(tested/plans*100) : 0 });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
