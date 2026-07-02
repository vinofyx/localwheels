const router  = require('express').Router();
const { authenticate: auth } = require('../middleware/auth');
const AutomationWorkflow = require('../models/AutomationWorkflow');
const AutomationJob      = require('../models/AutomationJob');
const AutomationExecution = require('../models/AutomationExecution');
const AutomationRule     = require('../models/AutomationRule');
const Anthropic = require('@anthropic-ai/sdk');

const ai  = new Anthropic();
const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// ── Workflows ──────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { category, is_active, limit = 20, page = 1 } = req.query;
    const cid = req.user.company_id;
    const filter = { company_id: cid };
    if (category)   filter.category  = category;
    if (is_active !== undefined) filter.is_active = is_active === 'true';
    const skip = (page - 1) * limit;
    const [workflows, total] = await Promise.all([
      AutomationWorkflow.find(filter).sort({ createdAt: -1 }).skip(skip).limit(+limit).lean(),
      AutomationWorkflow.countDocuments(filter),
    ]);
    ok(res, { workflows, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (e) { err(res, e.message, 500); }
});

router.get('/templates', auth, async (req, res) => {
  try {
    const templates = await AutomationWorkflow.find({ company_id: req.user.company_id, is_template: true }).lean();
    ok(res, { templates });
  } catch (e) { err(res, e.message, 500); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const wf = await AutomationWorkflow.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!wf) return err(res, 'Workflow not found', 404);
    const recentJobs = await AutomationJob.find({ workflow_id: wf._id }).sort({ createdAt: -1 }).limit(5).lean();
    ok(res, { workflow: wf, recent_jobs: recentJobs });
  } catch (e) { err(res, e.message, 500); }
});

router.post('/', auth, async (req, res) => {
  try {
    const wf = await AutomationWorkflow.create({ ...req.body, company_id: req.user.company_id, created_by: req.user.id });
    ok(res, wf, 'Workflow created', 201);
  } catch (e) { err(res, e.message); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const wf = await AutomationWorkflow.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: req.body }, { new: true }
    );
    if (!wf) return err(res, 'Not found', 404);
    ok(res, wf, 'Workflow updated');
  } catch (e) { err(res, e.message); }
});

router.post('/:id/run', auth, async (req, res) => {
  try {
    const wf = await AutomationWorkflow.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!wf) return err(res, 'Workflow not found', 404);
    if (!wf.is_active) return err(res, 'Workflow is inactive');

    const job = await AutomationJob.create({
      company_id:   req.user.company_id,
      workflow_id:  wf._id,
      workflow_name:wf.name,
      trigger_type: 'manual',
      triggered_by: req.user.id,
      trigger_data: req.body,
      steps_total:  wf.steps.length,
      status:       'queued',
    });

    wf.run_count   += 1;
    wf.last_run_at  = new Date();
    await wf.save();

    // Simulate async execution
    setImmediate(async () => {
      try {
        await AutomationJob.findByIdAndUpdate(job._id, { status: 'running', started_at: new Date() });
        await new Promise(r => setTimeout(r, 500)); // simulate work
        await AutomationJob.findByIdAndUpdate(job._id, {
          status: 'completed', steps_done: wf.steps.length,
          completed_at: new Date(), duration_ms: 500,
        });
        await AutomationWorkflow.findByIdAndUpdate(wf._id, { $inc: { success_count: 1 } });
      } catch (_) {
        await AutomationJob.findByIdAndUpdate(job._id, { status: 'failed', error: _.message });
        await AutomationWorkflow.findByIdAndUpdate(wf._id, { $inc: { failure_count: 1 } });
      }
    });

    ok(res, job, 'Workflow triggered', 201);
  } catch (e) { err(res, e.message, 500); }
});

// ── Rules ──────────────────────────────────────────────────────────────────
router.get('/rules/list', auth, async (req, res) => {
  try {
    const rules = await AutomationRule.find({ company_id: req.user.company_id })
      .sort({ priority: 1, createdAt: -1 }).lean();
    ok(res, { rules, total: rules.length });
  } catch (e) { err(res, e.message, 500); }
});

router.post('/rules', auth, async (req, res) => {
  try {
    const rule = await AutomationRule.create({ ...req.body, company_id: req.user.company_id, created_by: req.user.id });
    ok(res, rule, 'Rule created', 201);
  } catch (e) { err(res, e.message); }
});

router.put('/rules/:id', auth, async (req, res) => {
  try {
    const rule = await AutomationRule.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: req.body }, { new: true }
    );
    if (!rule) return err(res, 'Not found', 404);
    ok(res, rule, 'Rule updated');
  } catch (e) { err(res, e.message); }
});

// ── AI Workflow Builder ────────────────────────────────────────────────────
router.post('/ai-build', auth, async (req, res) => {
  try {
    const { description, category = 'custom' } = req.body;
    if (!description) return err(res, 'description required');

    const msg = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `You are an automation workflow designer for a logistics company. Generate a workflow JSON for: "${description}"
Return ONLY valid JSON with this exact structure:
{
  "name": "workflow name",
  "description": "brief description",
  "category": "${category}",
  "trigger_type": "manual",
  "steps": [
    {"step_number": 1, "name": "step name", "action_type": "action type", "action_config": {"key": "value"}}
  ]
}
Keep it to 3-5 steps. No markdown, no explanation, just JSON.`,
      }],
    });

    let wfData;
    try { wfData = JSON.parse(msg.content[0].text.trim()); } catch (_) {
      wfData = { name: description, description, category, trigger_type: 'manual', steps: [] };
    }

    ok(res, { workflow_draft: wfData });
  } catch (e) { err(res, e.message, 500); }
});

// ── Analytics summary ──────────────────────────────────────────────────────
router.get('/analytics/summary', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [wfTotal, wfActive, jobTotal, jobDone, jobFailed] = await Promise.all([
      AutomationWorkflow.countDocuments({ company_id: cid }),
      AutomationWorkflow.countDocuments({ company_id: cid, is_active: true }),
      AutomationJob.countDocuments({ company_id: cid }),
      AutomationJob.countDocuments({ company_id: cid, status: 'completed' }),
      AutomationJob.countDocuments({ company_id: cid, status: 'failed' }),
    ]);
    const successRate = jobTotal > 0 ? Math.round((jobDone / jobTotal) * 100) : 0;
    ok(res, { workflows: { total: wfTotal, active: wfActive }, jobs: { total: jobTotal, completed: jobDone, failed: jobFailed, success_rate_pct: successRate } });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
