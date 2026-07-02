const express   = require('express');
const router    = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate: auth } = require('../middleware/auth');

const SimulationScenario       = require('../models/SimulationScenario');
const ScenarioRecommendation   = require('../models/ScenarioRecommendation');
const OptimizationRecommendation = require('../models/OptimizationRecommendation');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

const BUILT_IN = [
  { name: 'Demand Surge +30%', category: 'demand',   description: 'Simulate 30% demand spike — peak season readiness', parameters: { demand_increase_pct: 30, duration_days: 14 } },
  { name: 'Fleet Breakdown 20%',category:'fleet',    description: 'Simulate 20% fleet unavailability impact on deliveries', parameters: { fleet_down_pct: 20, duration_days: 7 } },
  { name: 'Fuel Price +25%',   category: 'cost',     description: 'Simulate diesel price increase and cost impact', parameters: { fuel_price_increase_pct: 25, duration_days: 30 } },
  { name: 'Warehouse Congestion',category:'capacity',description: 'Simulate 90% warehouse utilisation scenario', parameters: { utilization_pct: 90, warehouses: 'all' } },
  { name: 'Supplier Failure',  category: 'supply',   description: 'Simulate primary supplier failure and alternate sourcing', parameters: { supplier_failure: true, recovery_days: 10 } },
  { name: 'Branch Closure',    category: 'risk',     description: 'Simulate closure of a key branch', parameters: { branches: 1, reroute: true } },
  { name: 'Holiday Load',      category: 'demand',   description: 'Simulate Diwali/festive season peak load', parameters: { demand_increase_pct: 50, duration_days: 10 } },
  { name: 'Weather Disruption',category: 'risk',     description: 'Simulate monsoon-related delivery delays', parameters: { delay_hours: 6, affected_routes_pct: 40 } },
  { name: 'Carbon Reduction 20%',category:'carbon',  description: 'Simulate route optimisation for 20% carbon cut', parameters: { target_reduction_pct: 20 } },
  { name: 'Route Optimisation', category: 'route',   description: 'Simulate AI route optimisation across all lanes', parameters: { optimization_level: 'full', ai_routing: true } },
];

// GET /api/scenarios
router.get('/', auth, async (req, res) => {
  try {
    const { category, status } = req.query;
    const filter = { company_id: req.user.company_id };
    if (category) filter.category = category;
    if (status)   filter.status   = status;
    const scenarios = await SimulationScenario.find(filter).sort({ createdAt: -1 }).lean();
    return ok(res, { scenarios, total: scenarios.length });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/scenarios/library
router.get('/library', auth, async (_req, res) => {
  return ok(res, { templates: BUILT_IN, total: BUILT_IN.length });
});

// POST /api/scenarios
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, category, parameters, assumptions, tags } = req.body;
    if (!name || !category) return err(res, 'name and category required');
    const scenario = await SimulationScenario.create({
      company_id: req.user.company_id, name, description, category, parameters, assumptions, tags,
      created_by: req.user._id,
    });
    return ok(res, scenario, 'Scenario created', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/scenarios/from-template
router.post('/from-template', auth, async (req, res) => {
  try {
    const { template_name, overrides } = req.body;
    const tpl = BUILT_IN.find(t => t.name === template_name);
    if (!tpl) return err(res, 'Template not found', 404);
    const scenario = await SimulationScenario.create({
      company_id: req.user.company_id,
      name: overrides?.name || tpl.name,
      description: tpl.description,
      category: tpl.category,
      parameters: { ...tpl.parameters, ...(overrides?.parameters || {}) },
      template: template_name,
      created_by: req.user._id,
    });
    return ok(res, scenario, 'Scenario created from template', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/scenarios/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const sc = await SimulationScenario.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!sc) return err(res, 'Not found', 404);
    const recs = await ScenarioRecommendation.find({ scenario_id: sc._id }).lean();
    return ok(res, { scenario: sc, recommendations: recs });
  } catch (e) { return err(res, e.message, 500); }
});

// PUT /api/scenarios/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const sc = await SimulationScenario.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      req.body, { new: true }
    );
    return ok(res, sc);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/scenarios/:id/ai-analyse
router.post('/:id/ai-analyse', auth, async (req, res) => {
  try {
    const sc = await SimulationScenario.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!sc) return err(res, 'Not found', 404);
    const client  = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Analyse this logistics scenario for a freight/delivery company:
Name: ${sc.name}, Category: ${sc.category}, Parameters: ${JSON.stringify(sc.parameters)}
Return JSON: [{"title":"...","description":"...","category":"cost|revenue|risk|efficiency|carbon","priority":"high|medium|low","estimated_saving":0,"actions":["..."],"confidence_pct":80}]
Return 3 recommendations as a JSON array only.`,
      }],
    });
    let recs = [];
    try { recs = JSON.parse(message.content[0].text); } catch { recs = []; }
    const saved = await Promise.all(recs.map(r => ScenarioRecommendation.create({
      company_id: req.user.company_id, scenario_id: sc._id, ...r, ai_generated: true,
    })));
    return ok(res, { recommendations: saved });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/scenarios/recommendations/all
router.get('/recommendations/all', auth, async (req, res) => {
  try {
    const { status, priority } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    const recs = await ScenarioRecommendation.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    return ok(res, { recommendations: recs, total: recs.length });
  } catch (e) { return err(res, e.message, 500); }
});

// PUT /api/scenarios/recommendations/:id/accept
router.put('/recommendations/:id/accept', auth, async (req, res) => {
  try {
    const rec = await ScenarioRecommendation.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { status: 'accepted', accepted_at: new Date(), accepted_by: req.user._id },
      { new: true }
    );
    return ok(res, rec, 'Recommendation accepted');
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/scenarios/optimizations/list
router.get('/optimizations/list', auth, async (req, res) => {
  try {
    const opts = await OptimizationRecommendation.find({ company_id: req.user.company_id })
      .sort({ createdAt: -1 }).limit(30).lean();
    return ok(res, { optimizations: opts, total: opts.length });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
