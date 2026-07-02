const express   = require('express');
const router    = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate: auth } = require('../middleware/auth');

const CarbonEmission     = require('../models/CarbonEmission');
const SustainabilityScore = require('../models/SustainabilityScore');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// GET /api/carbon
router.get('/', auth, async (req, res) => {
  try {
    const { source_type, fuel_type, limit = 30 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (source_type) filter.source_type = source_type;
    if (fuel_type)   filter.fuel_type   = fuel_type;
    const emissions = await CarbonEmission.find(filter).sort({ record_date: -1 }).limit(+limit).lean();
    return ok(res, { emissions, total: emissions.length });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/carbon — record emission
router.post('/', auth, async (req, res) => {
  try {
    const { distance_km, fuel_litres, fuel_type, vehicle_type, source_type } = req.body;
    const EMISSION_FACTORS = { diesel: 2.68, petrol: 2.31, cng: 1.87, ev: 0.1, hybrid: 1.5 };
    const factor  = EMISSION_FACTORS[fuel_type || 'diesel'];
    const co2_kg  = fuel_litres ? fuel_litres * factor : (distance_km || 0) * 0.18;
    const emission = await CarbonEmission.create({
      company_id: req.user.company_id, record_date: new Date(),
      source_type: source_type || 'vehicle', vehicle_type, fuel_type: fuel_type || 'diesel',
      distance_km: distance_km || 0, fuel_litres: fuel_litres || 0, co2_kg,
      co2_per_km: distance_km ? (co2_kg / distance_km).toFixed(3)*1 : 0,
      ...req.body,
    });
    return ok(res, emission, 'Carbon emission recorded', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/carbon/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const cid   = req.user.company_id;
    const since = new Date(Date.now() - 30 * 86400000);
    const since7 = new Date(Date.now() - 7 * 86400000);
    const [emissions30, emissions7] = await Promise.all([
      CarbonEmission.find({ company_id: cid, record_date: { $gte: since } }).lean(),
      CarbonEmission.find({ company_id: cid, record_date: { $gte: since7 } }).lean(),
    ]);
    const totalCO2_30 = emissions30.reduce((a, e) => a + (e.co2_kg || 0), 0);
    const totalCO2_7  = emissions7.reduce((a, e) => a + (e.co2_kg || 0), 0);
    const totalDist   = emissions30.reduce((a, e) => a + (e.distance_km || 0), 0);
    const score = await SustainabilityScore.findOne({ company_id: cid }).sort({ score_date: -1 }).lean();
    return ok(res, {
      co2_last_30d_kg: Math.round(totalCO2_30),
      co2_last_7d_kg:  Math.round(totalCO2_7),
      co2_per_km:      totalDist ? (totalCO2_30/totalDist).toFixed(3)*1 : 0,
      total_distance_km: Math.round(totalDist),
      emission_records: emissions30.length,
      sustainability_score: score?.overall_score || 0,
      sustainability_grade: score?.grade || 'C',
    });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/carbon/simulate — what-if carbon simulation
router.post('/simulate', auth, async (req, res) => {
  try {
    const { ev_fleet_pct, route_optimization_pct, load_factor_improvement } = req.body;
    const baseline_co2  = 1500;
    const reduction     = (ev_fleet_pct||0)*0.4 + (route_optimization_pct||0)*0.2 + (load_factor_improvement||0)*0.15;
    const simulated_co2 = baseline_co2 * (1 - reduction/100);
    return ok(res, {
      baseline_co2_kg: baseline_co2,
      simulated_co2_kg: Math.round(simulated_co2),
      reduction_kg: Math.round(baseline_co2 - simulated_co2),
      reduction_pct: reduction.toFixed(1)*1,
      annual_saving_trees: Math.round((baseline_co2 - simulated_co2) * 0.085),
      scenarios: [
        { label: 'EV Fleet Impact', reduction_kg: Math.round(baseline_co2*(ev_fleet_pct||0)*0.004) },
        { label: 'Route Optimisation', reduction_kg: Math.round(baseline_co2*(route_optimization_pct||0)*0.002) },
        { label: 'Load Factor', reduction_kg: Math.round(baseline_co2*(load_factor_improvement||0)*0.0015) },
      ],
    });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/carbon/ai-recommendations
router.post('/ai-recommendations', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const recent = await CarbonEmission.find({ company_id: cid }).sort({ createdAt: -1 }).limit(10).lean();
    const client = new Anthropic();
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Analyse these carbon emissions from a logistics fleet and suggest reductions: ${JSON.stringify(recent.slice(0,5))}
Return JSON: {"summary":"...","recommendations":[{"action":"...","reduction_kg":100,"cost_saving_inr":5000,"effort":"low|medium|high","priority":"high|medium|low"}]}
Return ONLY valid JSON with 4 recommendations.`,
      }],
    });
    let result = {};
    try { result = JSON.parse(message.content[0].text); } catch { result = { summary: 'Review fleet fuel efficiency', recommendations: [] }; }
    return ok(res, result);
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
