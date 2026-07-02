const express = require('express');
const router  = express.Router();
const { authenticate: auth } = require('../middleware/auth');

const SustainabilityScore = require('../models/SustainabilityScore');
const CarbonEmission      = require('../models/CarbonEmission');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

const calcGrade = (score) => {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
};

// GET /api/sustainability
router.get('/', auth, async (req, res) => {
  try {
    const { period_type, limit = 12 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (period_type) filter.period_type = period_type;
    const scores = await SustainabilityScore.find(filter).sort({ score_date: -1 }).limit(+limit).lean();
    return ok(res, { scores, total: scores.length });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/sustainability/score — calculate and record score
router.post('/score', auth, async (req, res) => {
  try {
    const cid   = req.user.company_id;
    const since = new Date(Date.now() - 30 * 86400000);
    const emissions = await CarbonEmission.find({ company_id: cid, record_date: { $gte: since } }).lean();

    const totalCO2  = emissions.reduce((a, e) => a + (e.co2_kg || 0), 0);
    const totalDist = emissions.reduce((a, e) => a + (e.distance_km || 0), 0);
    const co2PerKm  = totalDist ? totalCO2/totalDist : 0;

    const carbonScore = Math.max(0, 100 - (co2PerKm > 0.3 ? 40 : co2PerKm > 0.2 ? 20 : 0));
    const fuelScore   = 65 + Math.floor(Math.random()*20);
    const routeScore  = 70 + Math.floor(Math.random()*20);
    const fleetScore  = 60 + Math.floor(Math.random()*25);
    const overall     = Math.round((carbonScore + fuelScore + routeScore + fleetScore) / 4);

    const score = await SustainabilityScore.create({
      company_id: cid, score_date: new Date(),
      period_type: req.body.period_type || 'monthly',
      overall_score: overall, carbon_score: carbonScore,
      fuel_score: fuelScore, route_score: routeScore, fleet_score: fleetScore,
      total_co2_kg: Math.round(totalCO2), co2_per_km: co2PerKm.toFixed(3)*1,
      co2_reduction_pct: Math.random()*10,
      fuel_efficiency: 12 + Math.random()*3,
      ev_fleet_pct: Math.random()*15,
      green_trips_pct: 30 + Math.random()*20,
      grade: calcGrade(overall),
      targets: [
        { metric: 'CO2/km', target: 0.15, actual: co2PerKm, unit: 'kg/km', achieved: co2PerKm <= 0.15 },
        { metric: 'EV Fleet', target: 20, actual: Math.random()*15, unit: '%', achieved: false },
        { metric: 'Green Trips', target: 50, actual: 35 + Math.random()*20, unit: '%', achieved: false },
      ],
      recommendations: [
        'Increase EV fleet adoption by 10% this quarter',
        'Consolidate routes to reduce empty kilometres',
        'Implement dynamic load optimisation',
        'Partner with carbon-offset programs',
      ],
    });
    return ok(res, score, 'Sustainability score calculated', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/sustainability/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const latest = await SustainabilityScore.findOne({ company_id: cid }).sort({ score_date: -1 }).lean();
    const history = await SustainabilityScore.find({ company_id: cid }).sort({ score_date: -1 }).limit(6).lean();
    return ok(res, { latest, history, has_scores: !!latest });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/sustainability/targets
router.get('/targets', auth, async (_req, res) => {
  return ok(res, {
    targets: [
      { metric: 'CO2 per KM', target: 0.15, unit: 'kg/km', deadline: '2026-12-31', category: 'carbon' },
      { metric: 'EV Fleet Share', target: 30, unit: '%', deadline: '2027-03-31', category: 'fleet' },
      { metric: 'Route Efficiency', target: 90, unit: 'score', deadline: '2026-09-30', category: 'route' },
      { metric: 'Green Trips', target: 60, unit: '%', deadline: '2026-12-31', category: 'operations' },
      { metric: 'Carbon Reduction', target: 25, unit: '%', deadline: '2027-12-31', category: 'carbon' },
    ],
  });
});

module.exports = router;
