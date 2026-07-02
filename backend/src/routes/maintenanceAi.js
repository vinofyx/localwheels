const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate: auth } = require('../middleware/auth');
const MaintenancePrediction = require('../models/MaintenancePrediction');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const WorkOrder = require('../models/WorkOrder');
const VehicleTelemetry = require('../models/VehicleTelemetry');
const VehicleHealth = require('../models/VehicleHealth');
const FleetVehicle = require('../models/FleetVehicle');
const MaintenanceAnalytics = require('../models/MaintenanceAnalytics');

const anthropic = new Anthropic();

const VALID_COMPONENTS = ['engine','brakes','battery','tyre','oil','coolant','clutch','transmission','suspension','alternator','fuel_system','air_filter','fuel_filter','spark_plugs','timing_belt','other'];

function sanitizePredictions(preds) {
  return (Array.isArray(preds) ? preds : []).map(p => ({
    ...p,
    component: VALID_COMPONENTS.includes(p.component) ? p.component : 'other',
  })).filter(p => (p.failure_probability || 0) > 0.2);
}

// Core AI prediction function
async function generatePrediction(vehicle, latestTelemetry, healthRecord) {
  const context = {
    vehicle_number: vehicle.vehicle_number,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    odometer_km: latestTelemetry?.motion?.odometer || vehicle.odometer || 0,
    engine_hours: latestTelemetry?.engine?.engine_hours,
    engine_rpm_avg: latestTelemetry?.engine?.rpm,
    coolant_temp: latestTelemetry?.engine?.coolant_temp,
    battery_voltage: latestTelemetry?.electrical?.battery_voltage,
    fuel_level_pct: latestTelemetry?.fuel?.level_pct,
    tyre_pressure_fl: latestTelemetry?.tyres?.fl_pressure,
    dtc_codes: latestTelemetry?.dtc_codes || [],
    health_score: healthRecord?.score,
    health_components: healthRecord?.components,
    existing_issues: healthRecord?.predicted_issues || [],
  };

  const prompt = `You are a vehicle maintenance AI for a logistics fleet. Analyze this vehicle's telemetry data and predict maintenance requirements.

Vehicle Data:
${JSON.stringify(context, null, 2)}

Return a JSON array of up to 5 maintenance predictions, each with:
{
  "component": "engine|brakes|battery|tyre|oil|coolant|clutch|transmission|suspension|alternator|fuel_system|air_filter|other",
  "failure_type": "specific issue description",
  "maintenance_type": "oil_change|brake_service|battery|tyre_replacement|coolant|general_service|etc",
  "failure_probability": 0.0-1.0,
  "confidence_score": 0.0-1.0,
  "severity": "low|medium|high|critical",
  "days_until_failure": estimated days (null if no urgency),
  "km_until_failure": estimated km (null if unknown),
  "remaining_useful_life": days estimate,
  "contributing_factors": [{"factor": "...", "weight": 0.0-1.0, "observation": "..."}],
  "ai_explanation": "brief explanation",
  "recommendation": "specific action",
  "estimated_cost": INR amount estimate
}

Only include components with failure_probability > 0.2. Return raw JSON array only.`;

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0].text.trim();
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    return generateRulePredictions(context);
  }
}

function generateRulePredictions(ctx) {
  const preds = [];
  const km = ctx.odometer_km || 0;

  if (ctx.coolant_temp > 100) {
    preds.push({ component: 'coolant', failure_type: 'Overheating', maintenance_type: 'coolant', failure_probability: 0.85, confidence_score: 0.9, severity: 'critical', days_until_failure: 3, ai_explanation: 'Coolant temperature critically high', recommendation: 'Inspect cooling system immediately', estimated_cost: 5000 });
  }
  if (ctx.battery_voltage < 12.0) {
    preds.push({ component: 'battery', failure_type: 'Low Battery Voltage', maintenance_type: 'battery', failure_probability: 0.7, confidence_score: 0.85, severity: 'high', days_until_failure: 7, ai_explanation: 'Battery voltage below normal range', recommendation: 'Test battery and alternator', estimated_cost: 8000 });
  }
  if (km % 10000 < 500 && km > 5000) {
    preds.push({ component: 'oil', failure_type: 'Oil Change Due', maintenance_type: 'engine_oil', failure_probability: 0.9, confidence_score: 0.95, severity: 'medium', days_until_failure: 14, ai_explanation: 'Odometer indicates oil change interval', recommendation: 'Schedule oil change', estimated_cost: 2500 });
  }
  if (ctx.tyre_pressure_fl < 25) {
    preds.push({ component: 'tyre', failure_type: 'Low Tyre Pressure', maintenance_type: 'tyre_replacement', failure_probability: 0.6, confidence_score: 0.8, severity: 'high', days_until_failure: 2, ai_explanation: 'Front-left tyre pressure below safe threshold', recommendation: 'Check and inflate all tyres', estimated_cost: 500 });
  }
  return preds;
}

// POST /api/maintenance-ai/predict/:vehicleId — run AI prediction
router.post('/predict/:vehicleId', auth, async (req, res) => {
  try {
    const vehicle = await FleetVehicle.findOne({ _id: req.params.vehicleId, company_id: req.user.company_id });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const [latestTelemetry, healthRecord] = await Promise.all([
      VehicleTelemetry.findOne({ fleet_vehicle_id: vehicle._id }).sort({ recorded_at: -1 }),
      VehicleHealth.findOne({ fleet_vehicle_id: vehicle._id }).sort({ assessed_at: -1 }),
    ]);

    const rawPredictions = sanitizePredictions(await generatePrediction(vehicle, latestTelemetry, healthRecord));

    // Upsert active predictions
    const created = [];
    for (const p of rawPredictions) {
      const existing = await MaintenancePrediction.findOne({
        fleet_vehicle_id: vehicle._id,
        component: p.component,
        status: 'active',
      });
      if (existing) {
        await MaintenancePrediction.updateOne({ _id: existing._id }, {
          failure_probability: p.failure_probability,
          confidence_score: p.confidence_score,
          severity: p.severity,
          days_until_failure: p.days_until_failure,
          km_until_failure: p.km_until_failure,
          remaining_useful_life: p.remaining_useful_life,
          contributing_factors: p.contributing_factors,
          ai_explanation: p.ai_explanation,
          recommendation: p.recommendation,
          estimated_cost: p.estimated_cost,
          predicted_at: new Date(),
        });
        created.push(existing._id);
      } else {
        const pred = await MaintenancePrediction.create({
          company_id: req.user.company_id,
          fleet_vehicle_id: vehicle._id,
          vehicle_number: vehicle.vehicle_number,
          ...p,
          status: 'active',
          predicted_at: new Date(),
        });
        created.push(pred._id);
      }
    }

    const predictions = await MaintenancePrediction.find({ _id: { $in: created } });
    res.json({ vehicle: vehicle.vehicle_number, predictions_count: predictions.length, predictions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/maintenance-ai/predict-fleet — run predictions for all vehicles
router.post('/predict-fleet', auth, async (req, res) => {
  try {
    const vehicles = await FleetVehicle.find({ company_id: req.user.company_id, is_active: true }).limit(50);
    res.json({ message: `Prediction started for ${vehicles.length} vehicles`, count: vehicles.length });

    setImmediate(async () => {
      for (const vehicle of vehicles) {
        try {
          const [tel, health] = await Promise.all([
            VehicleTelemetry.findOne({ fleet_vehicle_id: vehicle._id }).sort({ recorded_at: -1 }),
            VehicleHealth.findOne({ fleet_vehicle_id: vehicle._id }).sort({ assessed_at: -1 }),
          ]);
          const preds = sanitizePredictions(await generatePrediction(vehicle, tel, health));
          for (const p of preds) {
            const ex = await MaintenancePrediction.findOne({ fleet_vehicle_id: vehicle._id, component: p.component, status: 'active' });
            if (!ex) {
              await MaintenancePrediction.create({ company_id: vehicle.company_id, fleet_vehicle_id: vehicle._id, vehicle_number: vehicle.vehicle_number, ...p, status: 'active' });
            }
          }
        } catch { /* skip failed vehicle */ }
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/maintenance-ai/schedule/:predictionId — auto-schedule from prediction
router.post('/schedule/:predictionId', auth, async (req, res) => {
  try {
    const pred = await MaintenancePrediction.findOne({ _id: req.params.predictionId, company_id: req.user.company_id });
    if (!pred) return res.status(404).json({ error: 'Prediction not found' });

    const daysUntil = pred.days_until_failure || 14;
    const scheduledDate = new Date(Date.now() + Math.max(1, daysUntil - 2) * 24 * 60 * 60 * 1000);

    const schedule = await MaintenanceSchedule.create({
      company_id:       pred.company_id,
      fleet_vehicle_id: pred.fleet_vehicle_id,
      vehicle_number:   pred.vehicle_number,
      prediction_id:    pred._id,
      title:            `AI Predicted: ${pred.failure_type}`,
      description:      pred.ai_explanation,
      maintenance_type: pred.maintenance_type || pred.component,
      category:         'predictive',
      priority:         pred.severity === 'critical' ? 'critical' : pred.severity === 'high' ? 'urgent' : 'normal',
      status:           'planned',
      scheduled_date:   scheduledDate,
      estimated_cost:   pred.estimated_cost,
      is_ai_scheduled:  true,
      ai_confidence:    pred.confidence_score,
      downtime_impact:  `Vehicle may need ${pred.days_until_failure || 'N/A'} days notice`,
      created_by:       req.user.id,
    });

    await MaintenancePrediction.updateOne({ _id: pred._id }, { status: 'scheduled', is_actioned: true });

    res.status(201).json({ schedule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/maintenance-ai/predictions — list predictions
router.get('/predictions', auth, async (req, res) => {
  try {
    const { status = 'active', severity, vehicle_id, limit = 50, page = 1 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (vehicle_id) filter.fleet_vehicle_id = vehicle_id;

    const [predictions, total] = await Promise.all([
      MaintenancePrediction.find(filter)
        .populate('fleet_vehicle_id', 'vehicle_number make model')
        .sort({ severity: -1, failure_probability: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      MaintenancePrediction.countDocuments(filter),
    ]);

    const stats = {
      critical: await MaintenancePrediction.countDocuments({ company_id: req.user.company_id, status: 'active', severity: 'critical' }),
      high:     await MaintenancePrediction.countDocuments({ company_id: req.user.company_id, status: 'active', severity: 'high' }),
      medium:   await MaintenancePrediction.countDocuments({ company_id: req.user.company_id, status: 'active', severity: 'medium' }),
    };

    res.json({ predictions, total, stats, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/maintenance-ai/dashboard — maintenance AI dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [
      activeVehicles,
      criticalPreds,
      openWOs,
      overdueSchedules,
      recentPreds,
      latestAnalytics,
    ] = await Promise.all([
      FleetVehicle.countDocuments({ company_id: cid, is_active: true }),
      MaintenancePrediction.countDocuments({ company_id: cid, status: 'active', severity: { $in: ['critical','high'] } }),
      WorkOrder.countDocuments({ company_id: cid, status: { $in: ['open','assigned','in_progress'] } }),
      MaintenanceSchedule.countDocuments({ company_id: cid, status: 'planned', scheduled_date: { $lt: new Date() } }),
      MaintenancePrediction.find({ company_id: cid, status: 'active' })
        .sort({ severity: -1, failure_probability: -1 })
        .limit(5)
        .populate('fleet_vehicle_id', 'vehicle_number'),
      MaintenanceAnalytics.findOne({ company_id: cid }).sort({ snapshot_at: -1 }),
    ]);

    res.json({
      kpis: {
        active_vehicles: activeVehicles,
        critical_alerts: criticalPreds,
        open_work_orders: openWOs,
        overdue_schedules: overdueSchedules,
        fleet_health_score: latestAnalytics?.fleet_health_score || null,
        uptime_pct: latestAnalytics?.uptime_pct || null,
        maintenance_cost_month: latestAnalytics?.total_maintenance_cost || 0,
        predictions_accuracy: latestAnalytics?.predictions_accuracy_pct || null,
      },
      top_alerts: recentPreds,
      latest_analytics: latestAnalytics,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/maintenance-ai/analytics/snapshot — generate analytics snapshot
router.post('/analytics/snapshot', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [vehicles, critPreds, openWOs, completedWOs, schedules] = await Promise.all([
      FleetVehicle.find({ company_id: cid, is_active: true }).select('_id'),
      MaintenancePrediction.countDocuments({ company_id: cid, status: 'active', severity: { $in: ['critical','high'] } }),
      WorkOrder.countDocuments({ company_id: cid, status: { $in: ['open','assigned','in_progress'] } }),
      WorkOrder.find({ company_id: cid, status: 'completed', updatedAt: { $gte: monthStart } }).select('total_cost actual_duration_hrs'),
      MaintenanceSchedule.countDocuments({ company_id: cid, status: 'planned', scheduled_date: { $lt: now } }),
    ]);

    const totalCost = completedWOs.reduce((s, w) => s + (w.total_cost || 0), 0);
    const avgDuration = completedWOs.length ? completedWOs.reduce((s, w) => s + (w.actual_duration_hrs || 0), 0) / completedWOs.length : 0;

    const analytics = await MaintenanceAnalytics.create({
      company_id: cid,
      period: 'monthly',
      period_date: monthStart,
      vehicles_total: vehicles.length,
      vehicles_critical: critPreds,
      work_orders_open: openWOs,
      work_orders_completed: completedWOs.length,
      work_orders_overdue: schedules,
      total_maintenance_cost: totalCost,
      avg_turnaround_hrs: avgDuration,
      critical_alerts: critPreds,
      snapshot_at: now,
    });

    res.json({ analytics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
