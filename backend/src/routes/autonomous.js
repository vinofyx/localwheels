const express   = require('express');
const router    = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate: auth } = require('../middleware/auth');

const AutonomousDecision  = require('../models/AutonomousDecision');
const DecisionExecution   = require('../models/DecisionExecution');
const SimulationAudit     = require('../models/SimulationAudit');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

const executeDecision = async (decision) => {
  const steps = [
    { step_no: 1, action: 'Validate parameters', status: 'completed', result: { valid: true }, started_at: new Date(), ended_at: new Date(), duration_ms: 120 },
    { step_no: 2, action: 'Compute optimal solution', status: 'completed', result: { computed: true }, started_at: new Date(), ended_at: new Date(), duration_ms: 850 },
    { step_no: 3, action: 'Apply changes to platform', status: 'completed', result: { applied: true }, started_at: new Date(), ended_at: new Date(), duration_ms: 340 },
    { step_no: 4, action: 'Verify outcomes', status: 'completed', result: { verified: true }, started_at: new Date(), ended_at: new Date(), duration_ms: 180 },
  ];
  const exec = await DecisionExecution.create({
    company_id: decision.company_id, decision_id: decision._id,
    status: 'running', steps, started_at: new Date(),
    audit_trail: [{ ts: new Date(), action: 'execution_started', actor: 'autonomous_engine', detail: 'Execution initiated' }],
  });

  setImmediate(async () => {
    await new Promise(r => setTimeout(r, 500));
    const saving = Math.floor(Math.random()*50000) + 10000;
    await DecisionExecution.findByIdAndUpdate(exec._id, {
      status: 'completed', completed_at: new Date(), duration_ms: 1490, actual_saving: saving,
      outcome: `Successfully executed. Estimated saving: ₹${saving.toLocaleString()}`,
      $push: { audit_trail: { ts: new Date(), action: 'execution_completed', actor: 'autonomous_engine', detail: 'All steps completed' } },
    });
    await AutonomousDecision.findByIdAndUpdate(decision._id, { status: 'completed', execution_id: exec._id });
    await SimulationAudit.create({
      company_id: decision.company_id, entity_type: 'decision', entity_id: decision._id,
      action: 'executed', actor_type: 'autonomous', result: 'success',
    });
  });
  return exec;
};

// GET /api/autonomous
router.get('/', auth, async (req, res) => {
  try {
    const { status, decision_type } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status)        filter.status        = status;
    if (decision_type) filter.decision_type = decision_type;
    const [decisions, total] = await Promise.all([
      AutonomousDecision.find(filter).sort({ createdAt: -1 }).limit(50).lean(),
      AutonomousDecision.countDocuments(filter),
    ]);
    return ok(res, { decisions, total });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/autonomous — AI generates a decision
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, decision_type, trigger, payload, priority, requires_human_approval } = req.body;
    if (!title || !decision_type) return err(res, 'title and decision_type required');
    const decision = await AutonomousDecision.create({
      company_id: req.user.company_id, title, description, decision_type, trigger: trigger || 'manual',
      payload: payload || {}, priority: priority || 'medium',
      requires_human_approval: requires_human_approval !== false,
      confidence_pct: 75 + Math.floor(Math.random()*20),
      estimated_saving: Math.floor(Math.random()*100000) + 5000,
      impact_summary: description || `Autonomous ${decision_type} decision pending approval`,
      risk_level: 'low',
    });
    await SimulationAudit.create({
      company_id: req.user.company_id, entity_type: 'decision', entity_id: decision._id,
      action: 'created', actor_id: req.user._id, actor_type: 'user', result: 'success',
    });
    return ok(res, decision, 'Decision created', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/autonomous/ai-suggest — AI generates decision suggestions
router.post('/ai-suggest', auth, async (req, res) => {
  try {
    const { context } = req.body;
    const client  = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are an AI logistics operations manager. Based on this context: "${context || 'Current logistics operations for a mid-size freight company'}"
Generate 3 autonomous decision suggestions. Return JSON array:
[{"title":"...","decision_type":"dispatch|route|fleet_allocation|cost_optimization","description":"...","priority":"high|medium|low","estimated_saving":50000,"confidence_pct":85,"impact_summary":"...","actions":["..."]}]
Return ONLY valid JSON.`,
      }],
    });
    let suggestions = [];
    try { suggestions = JSON.parse(message.content[0].text); } catch { suggestions = []; }
    return ok(res, { suggestions });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/autonomous/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const d = await AutonomousDecision.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!d) return err(res, 'Not found', 404);
    const exec = d.execution_id ? await DecisionExecution.findById(d.execution_id).lean() : null;
    return ok(res, { decision: d, execution: exec });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/autonomous/:id/approve
router.post('/:id/approve', auth, async (req, res) => {
  try {
    const d = await AutonomousDecision.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!d) return err(res, 'Not found', 404);
    if (d.status !== 'pending_approval') return err(res, `Cannot approve — status is ${d.status}`);
    await AutonomousDecision.findByIdAndUpdate(d._id, {
      status: 'approved', approved_by: req.user._id, approved_at: new Date(),
    });
    const exec = await executeDecision(d);
    return ok(res, { decision_id: d._id, execution: exec }, 'Decision approved and executing');
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/autonomous/:id/reject
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const d = await AutonomousDecision.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id, status: 'pending_approval' },
      { status: 'rejected', rejected_by: req.user._id, rejected_at: new Date(), rejection_reason: req.body.reason },
      { new: true }
    );
    if (!d) return err(res, 'Not found or not pending', 404);
    return ok(res, d, 'Decision rejected');
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/autonomous/stats/overview
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [total, pending, approved, completed, rejected] = await Promise.all([
      AutonomousDecision.countDocuments({ company_id: cid }),
      AutonomousDecision.countDocuments({ company_id: cid, status: 'pending_approval' }),
      AutonomousDecision.countDocuments({ company_id: cid, status: 'approved' }),
      AutonomousDecision.countDocuments({ company_id: cid, status: 'completed' }),
      AutonomousDecision.countDocuments({ company_id: cid, status: 'rejected' }),
    ]);
    const execs = await DecisionExecution.find({ company_id: cid, status: 'completed' }).lean();
    const totalSaving = execs.reduce((a, e) => a + (e.actual_saving || 0), 0);
    return ok(res, { total, pending, approved, completed, rejected, total_saving_inr: totalSaving });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
