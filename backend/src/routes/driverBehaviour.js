const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate: auth } = require('../middleware/auth');
const DriverBehaviour = require('../models/DriverBehaviour');
const VehicleTelemetry = require('../models/VehicleTelemetry');
const Driver = require('../models/Driver');

const anthropic = new Anthropic();

function computeScore(events, metrics) {
  let score = 100;
  score -= (events.harsh_braking || 0) * 3;
  score -= (events.harsh_acceleration || 0) * 2;
  score -= (events.harsh_turning || 0) * 2;
  score -= (events.speeding_events || 0) * 4;
  score -= (events.speed_limit_violations || 0) * 5;
  score -= (events.fatigue_events || 0) * 8;
  const idlePct = metrics.idle_pct || 0;
  if (idlePct > 20) score -= (idlePct - 20) * 0.5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function gradeFromScore(score) {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

// POST /api/driver-behaviour/analyze/:driverId — analyze driver behaviour from telemetry
router.post('/analyze/:driverId', auth, async (req, res) => {
  try {
    const { days = 7 } = req.body;
    const driver = await Driver.findOne({ _id: req.params.driverId, company_id: req.user.company_id });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get telemetry for vehicles this driver used (approximate — by fleet vehicle assignment)
    const telemetry = await VehicleTelemetry.find({
      company_id: req.user.company_id,
      recorded_at: { $gte: since },
      fleet_vehicle_id: driver.assigned_vehicle_id || { $exists: true },
    }).limit(1000).select('motion engine fuel recorded_at');

    // Aggregate events
    const events = { harsh_braking: 0, harsh_acceleration: 0, harsh_turning: 0, speeding_events: 0, speed_limit_violations: 0, idle_events: 0, fatigue_events: 0, sos_events: 0 };
    let totalSpeed = 0, maxSpeed = 0, totalIdle = 0, totalDist = 0;

    telemetry.forEach(t => {
      if (t.motion?.harsh_brake) events.harsh_braking++;
      if (t.motion?.harsh_acceleration) events.harsh_acceleration++;
      if (t.motion?.harsh_turn) events.harsh_turning++;
      if (t.motion?.speed > 80) events.speeding_events++;
      if (t.motion?.speed > 100) events.speed_limit_violations++;
      if (t.engine?.idle_time_min > 5) events.idle_events++;
      totalSpeed += t.motion?.speed || 0;
      maxSpeed = Math.max(maxSpeed, t.motion?.speed || 0);
      totalIdle += t.engine?.idle_time_min || 0;
    });

    const avgSpeed = telemetry.length ? totalSpeed / telemetry.length : 0;
    const idlePct = avgSpeed > 0 ? Math.round((totalIdle / (telemetry.length * 0.5)) * 100) : 0;
    const metrics = { avg_speed_kmh: Math.round(avgSpeed), max_speed_kmh: maxSpeed, idle_time_min: totalIdle, idle_pct: Math.min(100, idlePct), trips_count: Math.ceil(telemetry.length / 20) };

    const overallScore = computeScore(events, metrics);
    const safetyScore = Math.max(0, 100 - (events.harsh_braking * 4 + events.speeding_events * 5 + events.speed_limit_violations * 6 + events.fatigue_events * 10));
    const ecoScore = Math.max(0, 100 - (events.harsh_acceleration * 3 + events.idle_events * 2 + (idlePct > 20 ? idlePct : 0)));

    // AI coaching
    let aiCoaching = null, strengths = [], improvements = [];
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Driver behaviour analysis for logistics driver. Score: ${overallScore}/100. Events: ${JSON.stringify(events)}. Metrics: avg speed ${Math.round(avgSpeed)}km/h, max ${maxSpeed}km/h. Provide JSON: {"coaching": "one paragraph coaching message", "strengths": ["up to 2 strengths"], "improvements": ["up to 3 improvement tips"]}`,
        }],
      });
      const parsed = JSON.parse(msg.content[0].text.replace(/```json\n?|\n?```/g, '').trim());
      aiCoaching = parsed.coaching;
      strengths = parsed.strengths || [];
      improvements = parsed.improvements || [];
    } catch {
      strengths = overallScore >= 80 ? ['Safe driving habits'] : [];
      improvements = events.harsh_braking > 3 ? ['Reduce harsh braking'] : [];
    }

    const prevRecord = await DriverBehaviour.findOne({ driver_id: driver._id, period_type: 'weekly' }).sort({ period_start: -1 });
    const trend = prevRecord ? (overallScore > prevRecord.overall_score ? 'improving' : overallScore < prevRecord.overall_score ? 'declining' : 'stable') : 'stable';

    const record = await DriverBehaviour.create({
      company_id: req.user.company_id,
      driver_id: driver._id,
      driver_name: driver.full_name || driver.name,
      vehicle_number: driver.assigned_vehicle_number,
      fleet_vehicle_id: driver.assigned_vehicle_id,
      period_start: since,
      period_end: new Date(),
      period_type: 'weekly',
      overall_score: overallScore,
      safety_score: Math.min(100, safetyScore),
      eco_score: Math.min(100, ecoScore),
      compliance_score: Math.max(0, 100 - events.speed_limit_violations * 8),
      grade: gradeFromScore(overallScore),
      events,
      metrics,
      score_trend: trend,
      score_change: prevRecord ? overallScore - prevRecord.overall_score : 0,
      ai_coaching: aiCoaching,
      strengths,
      improvements,
    });

    res.status(201).json({ record, driver_name: driver.full_name || driver.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/driver-behaviour — list behaviour records
router.get('/', auth, async (req, res) => {
  try {
    const { driver_id, period_type, grade, page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (driver_id) filter.driver_id = driver_id;
    if (period_type) filter.period_type = period_type;
    if (grade) filter.grade = grade;

    const [records, total] = await Promise.all([
      DriverBehaviour.find(filter)
        .populate('driver_id', 'full_name name phone')
        .sort({ period_start: -1 })
        .skip((page-1)*limit)
        .limit(parseInt(limit)),
      DriverBehaviour.countDocuments(filter),
    ]);

    const avgScore = await DriverBehaviour.aggregate([
      { $match: { company_id: req.user.company_id } },
      { $group: { _id: null, avg: { $avg: '$overall_score' }, count: { $sum: 1 } } },
    ]);

    res.json({ records, total, page: parseInt(page), fleet_avg_score: avgScore[0]?.avg?.toFixed(1) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/driver-behaviour/leaderboard — driver safety leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const leaders = await DriverBehaviour.aggregate([
      { $match: { company_id: req.user.company_id } },
      { $sort: { period_start: -1 } },
      { $group: { _id: '$driver_id', driver_name: { $first: '$driver_name' }, overall_score: { $first: '$overall_score' }, safety_score: { $first: '$safety_score' }, eco_score: { $first: '$eco_score' }, grade: { $first: '$grade' }, trend: { $first: '$score_trend' } } },
      { $sort: { overall_score: -1 } },
      { $limit: 20 },
    ]);
    res.json({ leaderboard: leaders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/driver-behaviour/:driverId/history — driver history
router.get('/:driverId/history', auth, async (req, res) => {
  try {
    const records = await DriverBehaviour.find({
      company_id: req.user.company_id,
      driver_id: req.params.driverId,
    }).sort({ period_start: -1 }).limit(12);
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
