const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate: auth } = require('../middleware/auth');
const EngineHealth = require('../models/EngineHealth');
const VehicleTelemetry = require('../models/VehicleTelemetry');
const FleetVehicle = require('../models/FleetVehicle');

const anthropic = new Anthropic();

function computeEngineScore(metrics, current) {
  let score = 100;
  if (current.coolant_temp > 105) score -= 30;
  else if (current.coolant_temp > 95) score -= 15;
  if (current.oil_pressure < 150) score -= 25;
  else if (current.oil_pressure < 200) score -= 10;
  if (metrics.high_rpm_pct > 20) score -= 10;
  if (metrics.overtemp_events > 5) score -= 15;
  if (metrics.avg_load > 85) score -= 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function healthStatus(score) {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  if (score >= 30) return 'poor';
  return 'critical';
}

// POST /api/engine-health/assess/:vehicleId — compute engine health
router.post('/assess/:vehicleId', auth, async (req, res) => {
  try {
    const vehicle = await FleetVehicle.findOne({ _id: req.params.vehicleId, company_id: req.user.company_id });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const telemetry = await VehicleTelemetry.find({
      company_id: req.user.company_id,
      fleet_vehicle_id: vehicle._id,
      recorded_at: { $gte: since },
    }).select('engine recorded_at').limit(2000);

    const latest = await VehicleTelemetry.findOne({ fleet_vehicle_id: vehicle._id }).sort({ recorded_at: -1 }).select('engine dtc_codes');

    // Aggregate
    let totalRPM = 0, totalCoolant = 0, totalLoad = 0, maxRPM = 0, maxCoolant = 0, highRPMCount = 0, overtempCount = 0, totalHours = 0, totalIdle = 0;
    telemetry.forEach(t => {
      const e = t.engine || {};
      totalRPM += e.rpm || 0;
      totalCoolant += e.coolant_temp || 0;
      totalLoad += e.engine_load || 0;
      maxRPM = Math.max(maxRPM, e.rpm || 0);
      maxCoolant = Math.max(maxCoolant, e.coolant_temp || 0);
      if ((e.rpm || 0) > 3500) highRPMCount++;
      if ((e.coolant_temp || 0) > 100) overtempCount++;
      totalHours += (e.engine_hours || 0);
      totalIdle += (e.idle_time_min || 0);
    });

    const count = telemetry.length || 1;
    const averages = {
      avg_rpm: Math.round(totalRPM / count),
      avg_coolant_temp: Math.round(totalCoolant / count),
      avg_load: Math.round(totalLoad / count),
      max_rpm: maxRPM,
      max_coolant_temp: maxCoolant,
      high_rpm_pct: Math.round((highRPMCount / count) * 100),
      overtemp_events: overtempCount,
    };

    const current = {
      rpm: latest?.engine?.rpm,
      coolant_temp: latest?.engine?.coolant_temp,
      oil_pressure: latest?.engine?.oil_pressure,
      oil_temp: latest?.engine?.oil_temp,
      engine_load: latest?.engine?.engine_load,
      throttle_pos: latest?.engine?.throttle_pos,
      intake_air_temp: latest?.engine?.intake_air_temp,
    };

    const engineScore = computeEngineScore(averages, current);

    // AI analysis
    let aiAnalysis = null, predictedIssues = [];
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Engine health analysis for ${vehicle.vehicle_number}. Score: ${engineScore}/100. Avg RPM: ${averages.avg_rpm}, Max coolant: ${maxCoolant}°C, Oil pressure: ${current.oil_pressure || 'N/A'}kPa, Overtemp events: ${overtempCount}, DTC codes: ${JSON.stringify(latest?.dtc_codes || [])}. Return JSON: {"analysis": "brief paragraph", "predicted_issues": ["up to 3 issues if any"]}`,
        }],
      });
      const p = JSON.parse(msg.content[0].text.replace(/```json\n?|\n?```/g, '').trim());
      aiAnalysis = p.analysis;
      predictedIssues = p.predicted_issues || [];
    } catch {
      if (overtempCount > 5) predictedIssues.push('Cooling system degradation suspected');
      if (current.oil_pressure && current.oil_pressure < 180) predictedIssues.push('Low oil pressure — check oil level and pump');
    }

    const lastOilChangeKm = vehicle.odometer ? vehicle.odometer - 5000 : null;
    const oilLifeRemaining = lastOilChangeKm ? Math.max(0, 100 - ((vehicle.odometer || 0 - lastOilChangeKm) / 10000) * 100) : null;

    const record = await EngineHealth.create({
      company_id: req.user.company_id,
      fleet_vehicle_id: vehicle._id,
      vehicle_number: vehicle.vehicle_number,
      engine_score: engineScore,
      health_status: healthStatus(engineScore),
      current,
      averages,
      total_engine_hours: latest?.engine?.engine_hours,
      idle_ratio_pct: count > 0 ? Math.round((totalIdle / (count * 0.5)) * 100) : 0,
      oil_life_remaining_pct: oilLifeRemaining,
      active_dtc_codes: latest?.dtc_codes || [],
      ai_analysis: aiAnalysis,
      predicted_issues: predictedIssues,
    });

    res.status(201).json({ record });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/engine-health — list engine health records
router.get('/', auth, async (req, res) => {
  try {
    const { health_status, vehicle_id, page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (health_status) filter.health_status = health_status;
    if (vehicle_id) filter.fleet_vehicle_id = vehicle_id;

    const [records, total] = await Promise.all([
      EngineHealth.find(filter)
        .populate('fleet_vehicle_id', 'vehicle_number make model')
        .sort({ assessed_at: -1 })
        .skip((page-1)*limit)
        .limit(parseInt(limit)),
      EngineHealth.countDocuments(filter),
    ]);

    const avgScore = await EngineHealth.aggregate([
      { $match: { company_id: req.user.company_id } },
      { $group: { _id: '$fleet_vehicle_id', latest_score: { $first: '$engine_score' } } },
      { $group: { _id: null, avg: { $avg: '$latest_score' } } },
    ]);

    res.json({ records, total, page: parseInt(page), fleet_avg_engine_score: avgScore[0]?.avg?.toFixed(1) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/engine-health/:vehicleId/history — engine health trend
router.get('/:vehicleId/history', auth, async (req, res) => {
  try {
    const records = await EngineHealth.find({
      company_id: req.user.company_id,
      fleet_vehicle_id: req.params.vehicleId,
    }).sort({ assessed_at: -1 }).limit(30).select('engine_score health_status averages assessed_at');
    res.json({ records });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
