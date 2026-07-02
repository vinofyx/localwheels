const express   = require('express');
const router    = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate: auth } = require('../middleware/auth');

const SimulationAnalytics     = require('../models/SimulationAnalytics');
const Simulation              = require('../models/Simulation');
const AutonomousDecision      = require('../models/AutonomousDecision');
const ScenarioRecommendation  = require('../models/ScenarioRecommendation');
const CarbonEmission          = require('../models/CarbonEmission');
const OperationalRisk         = require('../models/OperationalRisk');
const SimulationResult        = require('../models/SimulationResult');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// GET /api/simulation-analytics/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const cid   = req.user.company_id;
    const since = new Date(Date.now() - 30 * 86400000);
    const [
      simTotal, simDone, simFail,
      decPending, decDone,
      recTotal, recAccepted,
      risks,
    ] = await Promise.all([
      Simulation.countDocuments({ company_id: cid, createdAt: { $gte: since } }),
      Simulation.countDocuments({ company_id: cid, status: 'completed', createdAt: { $gte: since } }),
      Simulation.countDocuments({ company_id: cid, status: 'failed',    createdAt: { $gte: since } }),
      AutonomousDecision.countDocuments({ company_id: cid, status: 'pending_approval' }),
      AutonomousDecision.countDocuments({ company_id: cid, status: 'completed' }),
      ScenarioRecommendation.countDocuments({ company_id: cid }),
      ScenarioRecommendation.countDocuments({ company_id: cid, status: 'accepted' }),
      OperationalRisk.countDocuments({ company_id: cid, severity: { $in: ['critical','high'] } }),
    ]);

    const results = await SimulationResult.find({ company_id: cid }).lean();
    const totalSaving = results.reduce((a, r) => a + Math.abs(r.cost_impact || 0), 0);
    const totalCarbon = results.reduce((a, r) => a + Math.abs(r.carbon_delta_kg || 0), 0);

    return ok(res, {
      simulations: { total: simTotal, completed: simDone, failed: simFail,
        success_rate_pct: simTotal ? Math.round(simDone/simTotal*100) : 0 },
      decisions:   { pending: decPending, completed: decDone },
      recommendations: { total: recTotal, accepted: recAccepted,
        acceptance_rate_pct: recTotal ? Math.round(recAccepted/recTotal*100) : 0 },
      high_risks: risks, total_saving_inr: totalSaving, carbon_saved_kg: totalCarbon,
    });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/simulation-analytics/history
router.get('/history', auth, async (req, res) => {
  try {
    const { period = 'daily', limit = 14 } = req.query;
    const history = await SimulationAnalytics.find({ company_id: req.user.company_id, period_type: period })
      .sort({ period_date: -1 }).limit(+limit).lean();
    return ok(res, { history });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/simulation-analytics/snapshot
router.post('/snapshot', auth, async (req, res) => {
  try {
    const cid   = req.user.company_id;
    const since = new Date(Date.now() - 86400000);
    const [simTotal, simDone, simFail, decMade, decApproved, decRej] = await Promise.all([
      Simulation.countDocuments({ company_id: cid, createdAt: { $gte: since } }),
      Simulation.countDocuments({ company_id: cid, status: 'completed', createdAt: { $gte: since } }),
      Simulation.countDocuments({ company_id: cid, status: 'failed',    createdAt: { $gte: since } }),
      AutonomousDecision.countDocuments({ company_id: cid, createdAt: { $gte: since } }),
      AutonomousDecision.countDocuments({ company_id: cid, status: { $in: ['approved','completed'] }, createdAt: { $gte: since } }),
      AutonomousDecision.countDocuments({ company_id: cid, status: 'rejected', createdAt: { $gte: since } }),
    ]);
    const recs = await ScenarioRecommendation.find({ company_id: cid, createdAt: { $gte: since } }).lean();
    const today = new Date(); today.setHours(0,0,0,0);
    const snap  = await SimulationAnalytics.findOneAndUpdate(
      { company_id: cid, period_date: today, period_type: 'daily' },
      { total_simulations: simTotal, completed_sims: simDone, failed_sims: simFail,
        decisions_made: decMade, decisions_approved: decApproved, decisions_rejected: decRej,
        recommendations_generated: recs.length,
        recommendations_accepted:  recs.filter(r => r.status === 'accepted').length },
      { upsert: true, new: true }
    );
    return ok(res, snap, 'Snapshot saved');
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/simulation-analytics/ai-insights
router.post('/ai-insights', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [sims, decisions] = await Promise.all([
      Simulation.find({ company_id: cid }).sort({ createdAt: -1 }).limit(5).lean(),
      AutonomousDecision.find({ company_id: cid }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);
    const client  = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Analyse simulation and autonomous decision data for a logistics company:
Recent simulations: ${JSON.stringify(sims.map(s => ({ name: s.name, type: s.sim_type, status: s.status })))}
Recent decisions: ${JSON.stringify(decisions.map(d => ({ title: d.title, type: d.decision_type, status: d.status })))}
Return JSON array of 3 strategic insights:
[{"insight":"...","recommendation":"...","priority":"high|medium|low","potential_saving_inr":100000}]
Return ONLY valid JSON.`,
      }],
    });
    let insights = [];
    try { insights = JSON.parse(message.content[0].text); } catch { insights = []; }
    return ok(res, { insights });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
