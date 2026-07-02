const express   = require('express');
const router    = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate: auth } = require('../middleware/auth');

const OperationalRisk = require('../models/OperationalRisk');
const Simulation      = require('../models/Simulation');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// GET /api/risk-simulation
router.get('/', auth, async (req, res) => {
  try {
    const { severity, status } = req.query;
    const filter = { company_id: req.user.company_id };
    if (severity) filter.severity = severity;
    if (status)   filter.status   = status;
    const risks = await OperationalRisk.find(filter).sort({ risk_score: -1 }).lean();
    return ok(res, { risks, total: risks.length });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/risk-simulation
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, risk_type, severity, likelihood, financial_exposure, mitigation_actions, tags } = req.body;
    if (!title || !risk_type) return err(res, 'title and risk_type required');
    const SEV = { critical: 4, high: 3, medium: 2, low: 1 };
    const LIK = { very_high: 5, high: 4, medium: 3, low: 2, very_low: 1 };
    const riskScore = ((SEV[severity||'medium'] || 2) * (LIK[likelihood||'medium'] || 3)) / 20 * 100;
    const risk = await OperationalRisk.create({
      company_id: req.user.company_id, title, description, risk_type, severity: severity || 'medium',
      likelihood: likelihood || 'medium', risk_score: Math.round(riskScore),
      financial_exposure: financial_exposure || 0,
      mitigation_actions: mitigation_actions || [], tags, created_by: req.user._id,
    });
    return ok(res, risk, 'Risk registered', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/risk-simulation/simulate — run risk scenario
router.post('/simulate', auth, async (req, res) => {
  try {
    const { risk_type, severity, scenario } = req.body;
    const sim = await Simulation.create({
      company_id: req.user.company_id,
      name: `Risk Sim — ${risk_type || 'general'} (${severity || 'medium'})`,
      sim_type: 'risk',
      parameters: { risk_type, severity, scenario },
      time_horizon_days: 14, created_by: req.user._id,
    });
    setImmediate(async () => {
      await Simulation.findByIdAndUpdate(sim._id, { status: 'completed', completed_at: new Date(), progress_pct: 100 });
    });
    return ok(res, sim, 'Risk simulation started', 202);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/risk-simulation/heatmap — risk heatmap data
router.post('/heatmap', auth, async (req, res) => {
  try {
    const risks = await OperationalRisk.find({ company_id: req.user.company_id }).lean();
    const heatmap = risks.map(r => ({
      id: r._id, title: r.title, risk_type: r.risk_type,
      severity: r.severity, likelihood: r.likelihood, risk_score: r.risk_score,
      financial_exposure: r.financial_exposure,
    }));
    const summary = {
      critical: risks.filter(r => r.severity === 'critical').length,
      high:     risks.filter(r => r.severity === 'high').length,
      medium:   risks.filter(r => r.severity === 'medium').length,
      low:      risks.filter(r => r.severity === 'low').length,
      total_exposure: risks.reduce((a, r) => a + (r.financial_exposure || 0), 0),
    };
    return ok(res, { heatmap, summary });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/risk-simulation/ai-assess
router.post('/ai-assess', auth, async (req, res) => {
  try {
    const risks = await OperationalRisk.find({ company_id: req.user.company_id })
      .sort({ risk_score: -1 }).limit(5).lean();
    const client = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Assess these logistics operational risks and provide mitigation strategies:
${JSON.stringify(risks.map(r => ({ title: r.title, type: r.risk_type, severity: r.severity, score: r.risk_score })))}
Return JSON: {"overall_risk_level":"high|medium|low","top_risk":"...","immediate_actions":["..."],"strategic_recommendations":["..."],"risk_score":75}
Return ONLY valid JSON.`,
      }],
    });
    let assessment = {};
    try { assessment = JSON.parse(message.content[0].text); } catch { assessment = { overall_risk_level: 'medium', risk_score: 50 }; }
    return ok(res, { assessment });
  } catch (e) { return err(res, e.message, 500); }
});

// PUT /api/risk-simulation/:id/mitigate
router.put('/:id/mitigate', auth, async (req, res) => {
  try {
    const risk = await OperationalRisk.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { status: 'mitigating', ...req.body, mitigated_at: req.body.status === 'mitigated' ? new Date() : undefined },
      { new: true }
    );
    return ok(res, risk, 'Risk updated');
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
