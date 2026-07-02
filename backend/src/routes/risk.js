const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const RiskAssessment = require('../models/RiskAssessment');
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic();

const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg, status = 400) => res.status(status).json({ status: false, message: msg });

const VALID_RISK_TYPES = ['weather','traffic','political','route_closure','vehicle_breakdown','supplier','warehouse','driver','delivery','financial','cyber','compliance','other'];
function sanitizeRiskType(t) { return VALID_RISK_TYPES.includes(t) ? t : 'other'; }

// GET /api/risk
router.get('/', auth, async (req, res) => {
  try {
    const { status, risk_type, severity, limit = 30 } = req.query;
    const q = { company_id: req.user.company_id };
    if (status) q.status = status;
    if (risk_type) q.risk_type = risk_type;
    if (severity) q.severity = severity;
    const risks = await RiskAssessment.find(q).sort({ risk_score: -1, createdAt: -1 }).limit(Number(limit)).lean();
    ok(res, { risks, total: risks.length });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/risk
router.post('/', auth, async (req, res) => {
  try {
    const { risk_type, severity, probability, title, description, affected_area, mitigation, entity_type, entity_id, entity_ref } = req.body;
    if (!title) return err(res, 'title required');
    const sevScore = { low: 25, medium: 50, high: 75, critical: 100 };
    const probScore = { unlikely: 20, possible: 45, likely: 70, almost_certain: 95 };
    const risk_score = Math.round((sevScore[severity] || 50) * (probScore[probability] || 45) / 100);
    const risk = await RiskAssessment.create({
      company_id: req.user.company_id, risk_type: sanitizeRiskType(risk_type), severity, probability,
      title, description, affected_area, mitigation, entity_type, entity_id, entity_ref, risk_score,
      created_by: req.user.id,
    });
    ok(res, risk, 'Risk assessment created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/risk/:id/status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const risk = await RiskAssessment.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { status } }, { new: true }
    );
    if (!risk) return err(res, 'Risk not found', 404);
    ok(res, risk, 'Status updated');
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/risk/ai-assess — AI generates risk assessment
router.post('/ai-assess', auth, async (req, res) => {
  try {
    const { context, entity_type, entity_ref } = req.body;
    if (!context) return err(res, 'context required');
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 600,
      messages: [{ role: 'user', content: `You are a logistics risk analyst. Analyze this situation and return JSON with 3 risk assessments: ${context}. Return: {"risks":[{"risk_type":"weather|traffic|political|route_closure|vehicle_breakdown|supplier|warehouse|driver|delivery|financial|other","severity":"low|medium|high|critical","probability":"unlikely|possible|likely|almost_certain","title":"...","description":"...","mitigation":"..."}]}` }],
    });
    const parsed = JSON.parse(msg.content[0].text.match(/\{[\s\S]*\}/)?.[0] || '{"risks":[]}');
    const created = await Promise.all((parsed.risks || []).slice(0, 3).map(r => {
      const sevScore = { low: 25, medium: 50, high: 75, critical: 100 };
      const probScore = { unlikely: 20, possible: 45, likely: 70, almost_certain: 95 };
      const risk_score = Math.round((sevScore[r.severity] || 50) * (probScore[r.probability] || 45) / 100);
      return RiskAssessment.create({
        company_id: req.user.company_id, risk_type: sanitizeRiskType(r.risk_type), severity: r.severity || 'medium',
        probability: r.probability || 'possible', title: r.title, description: r.description,
        mitigation: r.mitigation, risk_score, ai_generated: true, ai_confidence: 75,
        entity_type, entity_ref, valid_until: new Date(Date.now() + 7 * 86400000),
      });
    }));
    ok(res, { risks: created }, 'AI risk assessment complete', 201);
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/risk/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [total, active, critical, high, byType] = await Promise.all([
      RiskAssessment.countDocuments({ company_id: cid }),
      RiskAssessment.countDocuments({ company_id: cid, status: 'active' }),
      RiskAssessment.countDocuments({ company_id: cid, severity: 'critical', status: 'active' }),
      RiskAssessment.countDocuments({ company_id: cid, severity: 'high', status: 'active' }),
      RiskAssessment.aggregate([
        { $match: { company_id: require('mongoose').Types.ObjectId.createFromHexString(String(cid)) } },
        { $group: { _id: '$risk_type', count: { $sum: 1 }, avg_score: { $avg: '$risk_score' } } },
        { $sort: { avg_score: -1 } },
      ]),
    ]);
    const topRisks = await RiskAssessment.find({ company_id: cid, status: 'active' }).sort({ risk_score: -1 }).limit(5).lean();
    ok(res, { total, active, critical, high, by_type: byType, top_risks: topRisks });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
