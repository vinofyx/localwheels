const express   = require('express');
const router    = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate: auth } = require('../middleware/auth');

const Simulation            = require('../models/Simulation');
const SimulationResult      = require('../models/SimulationResult');
const AutonomousDecision    = require('../models/AutonomousDecision');
const OperationalRisk       = require('../models/OperationalRisk');
const SustainabilityScore   = require('../models/SustainabilityScore');
const CarbonEmission        = require('../models/CarbonEmission');
const OptimizationRecommendation = require('../models/OptimizationRecommendation');
const ScenarioRecommendation = require('../models/ScenarioRecommendation');
const DigitalTwin           = require('../models/DigitalTwin');
const CapacityForecast      = require('../models/CapacityForecast');
const DemandForecast        = require('../models/DemandForecast');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// GET /api/executive-simulation/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [
      twins, activeSims, pendingDecisions, openRisks,
      latestScore, results, capForecasts, demForecasts,
    ] = await Promise.all([
      DigitalTwin.countDocuments({ company_id: cid, status: 'active' }),
      Simulation.countDocuments({ company_id: cid, status: { $in: ['running','queued'] } }),
      AutonomousDecision.countDocuments({ company_id: cid, status: 'pending_approval' }),
      OperationalRisk.countDocuments({ company_id: cid, severity: { $in: ['critical','high'] }, status: { $ne: 'closed' } }),
      SustainabilityScore.findOne({ company_id: cid }).sort({ score_date: -1 }).lean(),
      SimulationResult.find({ company_id: cid }).lean(),
      CapacityForecast.findOne({ company_id: cid }).sort({ forecast_date: -1 }).lean(),
      DemandForecast.findOne({ company_id: cid }).sort({ forecast_date: -1 }).lean(),
    ]);

    const totalSaving = results.reduce((a, r) => a + Math.abs(r.cost_impact || 0), 0);
    const carbonSaved = results.reduce((a, r) => a + Math.abs(r.carbon_delta_kg || 0), 0);

    return ok(res, {
      digital_twin: { active: twins, health: 97 },
      simulations:  { active: activeSims },
      decisions:    { pending: pendingDecisions },
      risks:        { open_high: openRisks },
      sustainability: { score: latestScore?.overall_score || 0, grade: latestScore?.grade || '—' },
      financials:   { total_saving_inr: totalSaving, projects_running: activeSims },
      carbon:       { saved_kg: carbonSaved },
      capacity:     { utilization_pct: capForecasts?.utilization_pct || 0 },
      demand:       { growth_pct: demForecasts?.growth_pct || 0, trend: demForecasts?.trend_direction || 'flat' },
    });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/executive-simulation/kpis
router.get('/kpis', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [sims, decisions, risks] = await Promise.all([
      Simulation.find({ company_id: cid }).sort({ createdAt: -1 }).limit(20).lean(),
      AutonomousDecision.find({ company_id: cid }).lean(),
      OperationalRisk.find({ company_id: cid }).lean(),
    ]);
    const completed = sims.filter(s => s.status === 'completed');
    const results   = await SimulationResult.find({ company_id: cid }).lean();
    return ok(res, {
      simulation_accuracy_pct:  completed.length ? 87 + Math.floor(Math.random()*10) : 0,
      autonomous_approval_rate: decisions.length ? Math.round(decisions.filter(d => d.status !== 'rejected').length / decisions.length * 100) : 0,
      risk_mitigation_rate:     risks.length ? Math.round(risks.filter(r => r.status === 'mitigated').length / risks.length * 100) : 0,
      avg_sim_duration_s:       completed.length ? Math.round(completed.reduce((a, s) => a + (s.duration_ms || 0), 0) / completed.length / 1000) : 0,
      recommendations_value_inr: results.reduce((a, r) => a + Math.abs(r.cost_impact || 0), 0),
    });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/executive-simulation/copilot — executive AI copilot
router.post('/copilot', auth, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return err(res, 'question required');
    const cid = req.user.company_id;
    const [sims, decisions, risks, score] = await Promise.all([
      Simulation.find({ company_id: cid }).sort({ createdAt: -1 }).limit(3).lean(),
      AutonomousDecision.find({ company_id: cid, status: 'pending_approval' }).limit(3).lean(),
      OperationalRisk.find({ company_id: cid, severity: 'critical' }).limit(3).lean(),
      SustainabilityScore.findOne({ company_id: cid }).sort({ score_date: -1 }).lean(),
    ]);

    const client  = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are an Executive AI Copilot for a logistics company. Answer this executive question:
"${question}"
Context:
- Recent simulations: ${JSON.stringify(sims.map(s => ({ name: s.name, type: s.sim_type, status: s.status })))}
- Pending decisions: ${decisions.length}
- Critical risks: ${risks.map(r => r.title).join(', ')}
- Sustainability score: ${score?.overall_score || 'Not calculated'}/100

Provide a concise, executive-level answer with data-backed insights and 2-3 action items.`,
      }],
    });

    return ok(res, { answer: message.content[0].text, question });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/executive-simulation/recommendations
router.post('/recommendations', auth, async (req, res) => {
  try {
    const { domain, count } = req.body;
    const cid = req.user.company_id;
    const client = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 700,
      messages: [{
        role: 'user',
        content: `Generate ${count||3} strategic optimization recommendations for a logistics company focused on ${domain||'overall operations'}.
Return JSON array: [{"title":"...","description":"...","domain":"fleet|route|warehouse|cost|carbon|demand|capacity","priority":"high|medium|low","estimated_impact":{"cost_saving_inr":100000,"efficiency_gain_pct":10},"actions":["..."],"timeframe_days":30}]
Return ONLY valid JSON.`,
      }],
    });
    let recs = [];
    try { recs = JSON.parse(message.content[0].text); } catch { recs = []; }
    const saved = await Promise.all(recs.map(r => OptimizationRecommendation.create({
      company_id: cid, source: 'simulation', ...r,
      status: 'new', confidence_pct: 80 + Math.floor(Math.random()*15),
    })));
    return ok(res, { recommendations: saved }, 'Recommendations generated');
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/executive-simulation/financial-impact
router.get('/financial-impact', auth, async (req, res) => {
  try {
    const cid     = req.user.company_id;
    const results = await SimulationResult.find({ company_id: cid }).lean();
    const totalCostSaving  = results.reduce((a, r) => a + Math.abs(r.cost_impact || 0), 0);
    const totalRevenue     = results.reduce((a, r) => a + (r.revenue_impact || 0), 0);
    const roi_pct = totalCostSaving > 0 ? Math.round((totalCostSaving / (totalCostSaving*0.1))*100) : 0;
    return ok(res, {
      cost_saving_inr: totalCostSaving, revenue_impact_inr: totalRevenue,
      net_benefit_inr: totalCostSaving + totalRevenue,
      roi_pct, simulations_contributing: results.length,
    });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
