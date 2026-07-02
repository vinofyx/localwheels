const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const DecisionRecommendation = require('../models/DecisionRecommendation');
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic();

const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg, status = 400) => res.status(status).json({ status: false, message: msg });

const VALID_DEC_TYPES = ['alternative_route','alternative_vehicle','alternative_driver','alternative_warehouse','alternative_supplier','alternative_carrier','dynamic_eta','cost_optimization','capacity_optimization','delivery_optimization','risk_mitigation','other'];
function sanitizeDecType(t) { return VALID_DEC_TYPES.includes(t) ? t : 'other'; }

// GET /api/decision-engine
router.get('/', auth, async (req, res) => {
  try {
    const { status, type, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id };
    if (status) q.status = status;
    if (type) q.type = type;
    const recs = await DecisionRecommendation.find(q).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    ok(res, { recommendations: recs, total: recs.length });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/decision-engine/generate
router.post('/generate', auth, async (req, res) => {
  try {
    const { problem, context, entity_type, entity_ref, type: reqType } = req.body;
    if (!problem) return err(res, 'problem required');

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 700,
      messages: [{ role: 'user', content: `You are a logistics AI decision engine. Problem: ${problem}. Context: ${context || 'N/A'}. Generate a decision recommendation as JSON: {"type":"alternative_route|alternative_vehicle|alternative_driver|alternative_warehouse|alternative_supplier|alternative_carrier|dynamic_eta|cost_optimization|capacity_optimization|delivery_optimization|risk_mitigation|other","title":"...","problem":"...","recommendation":"...","rationale":"...","expected_saving":0,"expected_benefit":"...","confidence_pct":80,"options":[{"label":"...","description":"...","score":85}]}` }],
    });
    const parsed = JSON.parse(msg.content[0].text.match(/\{[\s\S]*\}/)?.[0] || '{}');
    const rec = await DecisionRecommendation.create({
      company_id: req.user.company_id,
      type: sanitizeDecType(parsed.type || reqType),
      priority: parsed.confidence_pct > 80 ? 'high' : 'medium',
      title: parsed.title || 'AI Recommendation',
      problem: parsed.problem || problem,
      recommendation: parsed.recommendation,
      rationale: parsed.rationale,
      expected_saving: parsed.expected_saving || 0,
      expected_benefit: parsed.expected_benefit,
      confidence_pct: parsed.confidence_pct || 75,
      options: parsed.options || [],
      entity_type, entity_ref,
      ai_model: 'claude-haiku-4-5-20251001',
      expires_at: new Date(Date.now() + 24 * 3600000),
    });
    ok(res, rec, 'Recommendation generated', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/decision-engine/:id/accept
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const { selected_option } = req.body;
    const rec = await DecisionRecommendation.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { status: 'accepted', selected_option, accepted_by: req.user.id, accepted_at: new Date() } },
      { new: true }
    );
    if (!rec) return err(res, 'Recommendation not found', 404);
    ok(res, rec, 'Recommendation accepted');
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/decision-engine/:id/reject
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const rec = await DecisionRecommendation.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { status: 'rejected' } }, { new: true }
    );
    if (!rec) return err(res, 'Recommendation not found', 404);
    ok(res, rec, 'Recommendation rejected');
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/decision-engine/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [total, pending, accepted, savings] = await Promise.all([
      DecisionRecommendation.countDocuments({ company_id: cid }),
      DecisionRecommendation.countDocuments({ company_id: cid, status: 'pending' }),
      DecisionRecommendation.countDocuments({ company_id: cid, status: 'accepted' }),
      DecisionRecommendation.aggregate([
        { $match: { company_id: require('mongoose').Types.ObjectId.createFromHexString(String(cid)), status: 'accepted' } },
        { $group: { _id: null, total_saving: { $sum: '$expected_saving' } } },
      ]),
    ]);
    ok(res, { total, pending, accepted, total_savings: savings[0]?.total_saving || 0 });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
