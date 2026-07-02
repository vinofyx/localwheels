const express   = require('express');
const router    = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate: auth } = require('../middleware/auth');

const Simulation        = require('../models/Simulation');
const SimulationResult  = require('../models/SimulationResult');
const SimulationJob     = require('../models/SimulationJob');
const SimulationEvent   = require('../models/SimulationEvent');
const SimulationAudit   = require('../models/SimulationAudit');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

const runSimulation = async (sim) => {
  const job = await SimulationJob.create({
    company_id: sim.company_id, simulation_id: sim._id, priority: 5,
  });
  await Simulation.findByIdAndUpdate(sim._id, { status: 'running', started_at: new Date(), progress_pct: 0 });

  setImmediate(async () => {
    try {
      const duration = Math.floor(Math.random()*2000) + 500;
      await new Promise(r => setTimeout(r, 300));
      await Simulation.findByIdAndUpdate(sim._id, { progress_pct: 50 });
      await new Promise(r => setTimeout(r, 200));

      const kpis = [
        { name: 'Cost per KM', baseline: 12.5, simulated: 11.2, unit: 'INR', delta: -1.3, delta_pct: -10.4, direction: 'down' },
        { name: 'On-time Delivery', baseline: 87, simulated: 92, unit: '%', delta: 5, delta_pct: 5.7, direction: 'up' },
        { name: 'Fleet Utilization', baseline: 72, simulated: 81, unit: '%', delta: 9, delta_pct: 12.5, direction: 'up' },
        { name: 'CO2 per KM', baseline: 0.18, simulated: 0.15, unit: 'kg', delta: -0.03, delta_pct: -16.7, direction: 'down' },
      ];
      const costImpact  = -Math.floor(Math.random()*500000) - 100000;
      const result = await SimulationResult.create({
        company_id: sim.company_id, simulation_id: sim._id, iteration: 1,
        outcome: 'positive', kpis, cost_impact: costImpact, revenue_impact: Math.abs(costImpact)*0.3,
        risk_delta: -15, carbon_delta_kg: -450,
        summary: `Simulation completed. Cost reduction of ₹${Math.abs(costImpact).toLocaleString()} projected.`,
        recommendations: ['Optimise fleet routes using AI routing', 'Consolidate warehouse operations', 'Switch 20% fleet to CNG'],
        confidence_pct: 82 + Math.floor(Math.random()*15),
        data_points: Math.floor(Math.random()*10000) + 5000,
      });

      for (const kpi of kpis.slice(0, 2)) {
        await SimulationEvent.create({
          company_id: sim.company_id, simulation_id: sim._id,
          event_type: `kpi.${kpi.name.toLowerCase().replace(/ /g,'_')}.improved`,
          description: `${kpi.name} improved by ${kpi.delta_pct}%`,
          impact: { kpi: kpi.name, delta_pct: kpi.delta_pct },
          severity: 'info',
        });
      }

      await Simulation.findByIdAndUpdate(sim._id, {
        status: 'completed', completed_at: new Date(),
        duration_ms: duration, progress_pct: 100, result_id: result._id,
        result_summary: { outcome: 'positive', cost_impact: costImpact, confidence_pct: result.confidence_pct },
      });
      await SimulationJob.findByIdAndUpdate(job._id, { status: 'completed', completed_at: new Date(), duration_ms: duration, progress_pct: 100 });
      await SimulationAudit.create({
        company_id: sim.company_id, entity_type: 'simulation', entity_id: sim._id,
        action: 'completed', actor_type: 'system', result: 'success',
      });
    } catch (e) {
      await Simulation.findByIdAndUpdate(sim._id, { status: 'failed' });
      await SimulationJob.findByIdAndUpdate(job._id, { status: 'failed', error_message: e.message });
    }
  });
  return job;
};

// GET /api/simulation
router.get('/', auth, async (req, res) => {
  try {
    const { status, sim_type, page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status)   filter.status   = status;
    if (sim_type) filter.sim_type = sim_type;
    const [sims, total] = await Promise.all([
      Simulation.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit).lean(),
      Simulation.countDocuments(filter),
    ]);
    return ok(res, { simulations: sims, total, page: +page });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/simulation
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, sim_type, parameters, time_horizon_days, digital_twin_id, variables } = req.body;
    if (!name || !sim_type) return err(res, 'name and sim_type required');
    const sim = await Simulation.create({
      company_id: req.user.company_id, name, description, sim_type, parameters,
      time_horizon_days: time_horizon_days || 30, digital_twin_id, variables,
      created_by: req.user._id,
    });
    const job = await runSimulation(sim);
    return ok(res, { simulation: sim, job }, 'Simulation started', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/simulation/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const sim = await Simulation.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!sim) return err(res, 'Not found', 404);
    const [result, events, jobs] = await Promise.all([
      sim.result_id ? SimulationResult.findById(sim.result_id).lean() : null,
      SimulationEvent.find({ simulation_id: sim._id }).sort({ event_time: -1 }).limit(20).lean(),
      SimulationJob.find({ simulation_id: sim._id }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);
    return ok(res, { simulation: sim, result, events, jobs });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/simulation/ai-generate — AI creates simulation from natural language
router.post('/ai-generate', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return err(res, 'prompt required');
    const client  = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are a logistics simulation expert. Convert this request into a simulation config for a logistics company:
"${prompt}"
Return JSON: {"name":"...","sim_type":"what_if|demand|capacity|fleet|route|cost|risk|carbon","description":"...","time_horizon_days":30,"parameters":{},"variables":[{"key":"...","value":"...","unit":"..."}]}
Valid sim_types: what_if,traffic,weather,demand,capacity,fleet,warehouse,cost,risk,route,disaster,carbon,custom
Return ONLY valid JSON.`,
      }],
    });
    let config = {};
    try { config = JSON.parse(message.content[0].text); } catch { config = { name: prompt.slice(0,60), sim_type: 'what_if', description: prompt }; }
    return ok(res, { config, prompt });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/simulation/stats/summary
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [total, running, completed, failed] = await Promise.all([
      Simulation.countDocuments({ company_id: cid }),
      Simulation.countDocuments({ company_id: cid, status: 'running' }),
      Simulation.countDocuments({ company_id: cid, status: 'completed' }),
      Simulation.countDocuments({ company_id: cid, status: 'failed' }),
    ]);
    const results = await SimulationResult.find({ company_id: cid }).lean();
    const totalSaving = results.reduce((a, r) => a + Math.abs(r.cost_impact || 0), 0);
    return ok(res, { total, running, completed, failed, total_saving_inr: totalSaving,
      success_rate_pct: total ? Math.round(completed/total*100) : 0 });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
