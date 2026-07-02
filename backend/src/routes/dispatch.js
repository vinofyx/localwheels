const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');

const { authenticate: auth } = require('../middleware/auth');
const { log: auditLog }      = require('../utils/audit');
const { buildDispatchPlans, getExceptionResolution, genPlanNumber, SLA_HOURS } = require('../utils/dispatchEngine');
const { buildManifest, buildLoadingChecklist, genTripNumber } = require('../utils/manifestGenerator');

const DispatchQueue     = require('../models/DispatchQueue');
const DispatchPlan      = require('../models/DispatchPlan');
const DispatchManifest  = require('../models/DispatchManifest');
const Trip              = require('../models/Trip');
const DispatchException = require('../models/DispatchException');
const LoadingChecklist  = require('../models/LoadingChecklist');
const Shipment          = require('../models/Shipment');
const FleetVehicle      = require('../models/FleetVehicle');
const Driver            = require('../models/Driver');
const DispatcherShift   = require('../models/DispatcherShift');
const DispatchApproval  = require('../models/DispatchApproval');
const DispatchImpact    = require('../models/DispatchImpact');
const {
  acknowledgeTrip, analyzeCustomerImpact, autoReplan, getDispatcherPerformance,
  startShift, handoverShift, requiresApproval, requestApproval, reviewApproval,
} = require('../utils/dispatcherOps');

// ─── GET /api/dispatch/queue ──────────────────────────────────────────────────
router.get('/queue', auth, async (req, res) => {
  try {
    const { status, priority, branch_id, destination, page = 1, limit = 50 } = req.query;
    const filter = { company_id: req.user.company_id };

    if (status)    filter.status   = status;
    if (priority)  filter.priority = priority;
    if (branch_id) filter.branch_id = branch_id;
    if (destination) filter.destination = { $regex: destination, $options: 'i' };

    const [items, total] = await Promise.all([
      DispatchQueue.find(filter)
        .sort({ priority: 1, queued_at: 1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      DispatchQueue.countDocuments(filter),
    ]);

    // Status counts for summary bar
    const counts = await DispatchQueue.aggregate([
      { $match: { company_id: new mongoose.Types.ObjectId(req.user.company_id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const statusCounts = counts.reduce((acc, c) => { acc[c._id] = c.count; return acc; }, {});

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / limit), status_counts: statusCounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/dispatch/queue/add ─────────────────────────────────────────────
// Add a shipment to the dispatch queue
router.post('/queue/add', auth, async (req, res) => {
  try {
    const { shipment_id, priority = 'normal', delivery_date, time_window_start, time_window_end } = req.body;
    if (!shipment_id) return res.status(400).json({ error: 'shipment_id required' });

    const shipment = await Shipment.findOne({ _id: shipment_id, company_id: req.user.company_id }).lean();
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    // Prevent duplicates
    const existing = await DispatchQueue.findOne({ company_id: req.user.company_id, shipment_id });
    if (existing) return res.status(409).json({ error: 'Shipment already in dispatch queue', queue: existing });

    const slaHours   = SLA_HOURS[priority] || 48;
    const slaDeadline = new Date(Date.now() + slaHours * 3600000);

    const entry = await DispatchQueue.create({
      company_id:   req.user.company_id,
      branch_id:    req.user.branch_id,
      shipment_id,
      lr_number:    shipment.lr_number,
      priority,
      sender_name:  shipment.sender_name,
      receiver_name:shipment.receiver_name,
      destination:  shipment.destination,
      weight:       shipment.weight,
      packages:     shipment.packages,
      delivery_date: delivery_date || shipment.eta_date,
      time_window_start, time_window_end,
      sla_hours:    slaHours,
      sla_deadline: slaDeadline,
      status:       'pending',
      queued_at:    new Date(),
      created_by:   req.user._id,
    });

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/dispatch/optimize ──────────────────────────────────────────────
// AI creates optimized dispatch plans for all pending/ready queue items
router.post('/optimize', auth, async (req, res) => {
  try {
    const { origin_lat, origin_lng, origin_address, queue_ids } = req.body;

    // Load queue items
    const filter = { company_id: req.user.company_id, status: { $in: ['pending','ready'] } };
    if (queue_ids?.length) filter._id = { $in: queue_ids };

    const queueItems = await DispatchQueue.find(filter).sort({ priority: 1, queued_at: 1 }).lean();
    if (!queueItems.length) return res.status(400).json({ error: 'No pending shipments in queue' });

    const plans = await buildDispatchPlans({
      companyId:     req.user.company_id,
      queueItems,
      originLat:     origin_lat  || 18.5204,
      originLng:     origin_lng  || 73.8567,
      originAddress: origin_address || 'Main Depot',
    });

    // Persist each plan as a draft DispatchPlan
    const createdPlans = [];
    for (const p of plans) {
      const plan = await DispatchPlan.create({
        company_id:   req.user.company_id,
        branch_id:    req.user.branch_id,
        plan_number:  genPlanNumber('DP'),
        shipment_ids: p.shipments.map(s => s._id),
        lr_numbers:   p.shipments.map(s => s.lr_number),
        queue_ids:    p.queue_ids,
        recommended_vehicle_id:  p.best_vehicle?._id,
        recommended_vehicle_num: p.best_vehicle?.vehicle_number,
        recommended_driver_id:   p.best_driver?._id,
        recommended_driver_name: p.best_driver?.name,
        vehicle_id:     p.best_vehicle?._id,
        vehicle_number: p.best_vehicle?.vehicle_number,
        driver_id:      p.best_driver?._id,
        driver_name:    p.best_driver?.name,
        total_weight_kg:  p.total_weight_kg,
        total_packages:   p.total_packages,
        total_stops:      p.shipments.length,
        load_type:        p.load_type,
        utilization_pct:  p.utilization_pct,
        origin_address:   origin_address || 'Main Depot',
        planned_dispatch_time: p.planned_dispatch_time,
        estimated_arrival:     p.estimated_arrival,
        ai_confidence:    p.ai_confidence,
        ai_reasoning:     p.ai_reasoning,
        ai_risks:         p.ai_risks,
        ai_grouping_reason: p.ai_grouping_reason,
        fuel_cost_estimate: Math.round(((p.total_weight_kg / 1000) / 8) * 92 * 50), // rough estimate
        status:      'draft',
        created_by:  req.user._id,
      });

      // Mark queue items as assigned
      await DispatchQueue.updateMany(
        { _id: { $in: p.queue_ids } },
        { status: 'assigned', dispatch_plan_id: plan._id }
      );

      createdPlans.push({ plan, groupData: p });
    }

    await auditLog({ company_id: req.user.company_id, user: req.user, action: 'dispatch_optimize', resource: 'DispatchPlan', details: `${createdPlans.length} plan(s) created` });

    res.status(201).json({ success: true, plans_created: createdPlans.length, plans: createdPlans.map(cp => cp.plan) });
  } catch (err) {
    console.error('Dispatch optimize error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/dispatch/create ────────────────────────────────────────────────
// Approve a plan and create a Trip
router.post('/create', auth, async (req, res) => {
  try {
    const { dispatch_plan_id, approve = true } = req.body;
    if (!dispatch_plan_id) return res.status(400).json({ error: 'dispatch_plan_id required' });

    const plan = await DispatchPlan.findOne({ _id: dispatch_plan_id, company_id: req.user.company_id });
    if (!plan) return res.status(404).json({ error: 'Dispatch plan not found' });
    if (plan.status === 'in_progress') return res.status(400).json({ error: 'Plan already in progress' });

    // Build stop list from shipments
    const shipments = await Shipment.find({ _id: { $in: plan.shipment_ids }, company_id: req.user.company_id }).lean();
    const stops = shipments.map((s, i) => ({
      sequence:       i + 1,
      shipment_id:    s._id,
      lr_number:      s.lr_number,
      address:        s.receiver_address || s.destination,
      lat:            s.receiver_lat,
      lng:            s.receiver_lng,
      stop_type:      'delivery',
      priority:       s.priority || 'normal',
      receiver_name:  s.receiver_name,
      receiver_phone: s.receiver_phone,
      packages:       s.packages || 1,
      weight_kg:      s.weight || 0,
      estimated_arrival: plan.estimated_arrival,
      status:         'pending',
    }));

    // Get driver phone
    let driverPhone = '';
    if (plan.driver_id) {
      const d = await Driver.findById(plan.driver_id).lean();
      driverPhone = d?.phone || '';
    }

    const trip = await Trip.create({
      company_id:     plan.company_id,
      branch_id:      plan.branch_id,
      trip_number:    genTripNumber(),
      dispatch_plan_id: plan._id,
      shipment_ids:   plan.shipment_ids,
      lr_numbers:     plan.lr_numbers,
      vehicle_id:     plan.vehicle_id,
      driver_id:      plan.driver_id,
      vehicle_number: plan.vehicle_number,
      driver_name:    plan.driver_name,
      driver_phone:   driverPhone,
      stops,
      origin_address: plan.origin_address,
      trip_type:      shipments.length > 1 ? 'multi_stop' : 'single',
      status:         'planned',
      total_weight_kg: plan.total_weight_kg,
      total_packages:  plan.total_packages,
      load_utilization_pct: plan.utilization_pct,
      planned_start:  plan.planned_dispatch_time,
      planned_end:    plan.estimated_arrival,
      estimated_duration_min: plan.estimated_duration_min,
      total_distance_km:      plan.total_distance_km,
      fuel_cost:      plan.fuel_cost_estimate,
      trip_cost:      plan.trip_cost_estimate,
      created_by:     req.user._id,
      approved_by:    approve ? req.user._id : undefined,
      approved_at:    approve ? new Date() : undefined,
    });

    // Update plan
    plan.trip_id     = trip._id;
    plan.status      = approve ? 'approved' : 'draft';
    plan.approved_by = approve ? req.user._id : undefined;
    plan.approved_at = approve ? new Date() : undefined;
    await plan.save();

    await auditLog({ company_id: req.user.company_id, user: req.user, action: 'dispatch_create_trip', resource: 'Trip', resource_id: trip._id });

    res.status(201).json({ success: true, trip, plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/dispatch/assign-driver ─────────────────────────────────────────
router.post('/assign-driver', auth, async (req, res) => {
  try {
    const { plan_id, trip_id, driver_id, reason } = req.body;
    const id = plan_id || trip_id;
    if (!id || !driver_id) return res.status(400).json({ error: 'plan_id/trip_id and driver_id required' });

    const driver = await Driver.findOne({ _id: driver_id, company_id: req.user.company_id }).lean();
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    if (plan_id) {
      await DispatchPlan.findOneAndUpdate(
        { _id: plan_id, company_id: req.user.company_id },
        { driver_id, driver_name: driver.name, is_manual_override: true, override_reason: reason, override_by: req.user._id }
      );
    }
    if (trip_id) {
      await Trip.findOneAndUpdate(
        { _id: trip_id, company_id: req.user.company_id },
        { driver_id, driver_name: driver.name, driver_phone: driver.phone }
      );
    }

    await auditLog({ company_id: req.user.company_id, user: req.user, action: 'dispatch_assign_driver', resource: 'DispatchPlan', resource_id: id });
    res.json({ success: true, driver });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/dispatch/assign-vehicle ───────────────────────────────────────
router.post('/assign-vehicle', auth, async (req, res) => {
  try {
    const { plan_id, trip_id, vehicle_id, reason } = req.body;
    const id = plan_id || trip_id;
    if (!id || !vehicle_id) return res.status(400).json({ error: 'plan_id/trip_id and vehicle_id required' });

    const vehicle = await FleetVehicle.findOne({ _id: vehicle_id, company_id: req.user.company_id }).lean();
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    if (plan_id) {
      await DispatchPlan.findOneAndUpdate(
        { _id: plan_id, company_id: req.user.company_id },
        { vehicle_id, vehicle_number: vehicle.vehicle_number, is_manual_override: true, override_reason: reason, override_by: req.user._id }
      );
    }
    if (trip_id) {
      await Trip.findOneAndUpdate(
        { _id: trip_id, company_id: req.user.company_id },
        { vehicle_id, vehicle_number: vehicle.vehicle_number }
      );
    }

    await auditLog({ company_id: req.user.company_id, user: req.user, action: 'dispatch_assign_vehicle', resource: 'DispatchPlan', resource_id: id });
    res.json({ success: true, vehicle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/dispatch/generate-manifest ────────────────────────────────────
router.post('/generate-manifest', auth, async (req, res) => {
  try {
    const { trip_id } = req.body;
    if (!trip_id) return res.status(400).json({ error: 'trip_id required' });

    const trip = await Trip.findOne({ _id: trip_id, company_id: req.user.company_id }).lean();
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const plan = trip.dispatch_plan_id
      ? await DispatchPlan.findById(trip.dispatch_plan_id).lean()
      : null;

    const manifestData = await buildManifest({
      trip, dispatchPlan: plan, companyId: req.user.company_id, generatedBy: req.user._id,
    });

    const manifest = await DispatchManifest.create(manifestData);

    // Update trip with manifest ref
    await Trip.updateOne({ _id: trip_id }, { manifest_id: manifest._id });

    // Build loading checklist
    const checklistData = await buildLoadingChecklist({
      trip, manifestId: manifest._id, companyId: req.user.company_id, userId: req.user._id,
    });
    await LoadingChecklist.create(checklistData);

    res.status(201).json({ success: true, manifest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/dispatch/manifests ─────────────────────────────────────────────
router.get('/manifests', auth, async (req, res) => {
  try {
    const { trip_id, page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (trip_id) filter.trip_id = trip_id;

    const [manifests, total] = await Promise.all([
      DispatchManifest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).lean(),
      DispatchManifest.countDocuments(filter),
    ]);

    res.json({ manifests, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/dispatch/manifests/:number ─────────────────────────────────────
router.get('/manifests/:number', async (req, res) => {
  try {
    const manifest = await DispatchManifest.findOne({ manifest_number: req.params.number }).lean();
    if (!manifest) return res.status(404).json({ error: 'Manifest not found' });
    res.json(manifest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/dispatch/start-trip ───────────────────────────────────────────
router.post('/start-trip', auth, async (req, res) => {
  try {
    const { trip_id, odometer_start } = req.body;
    if (!trip_id) return res.status(400).json({ error: 'trip_id required' });

    const trip = await Trip.findOne({ _id: trip_id, company_id: req.user.company_id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (!trip.vehicle_id || !trip.driver_id) return res.status(400).json({ error: 'Assign vehicle and driver before starting' });

    trip.status       = 'in_progress';
    trip.actual_start = new Date();
    if (odometer_start) trip.odometer_start = odometer_start;
    await trip.save();

    // Update plan status
    if (trip.dispatch_plan_id) {
      await DispatchPlan.updateOne({ _id: trip.dispatch_plan_id }, { status: 'in_progress' });
    }

    // Update vehicle + driver status
    await Promise.all([
      trip.vehicle_id ? FleetVehicle.updateOne({ _id: trip.vehicle_id }, { status: 'on_trip', status_since: new Date() }) : null,
      trip.driver_id  ? Driver.updateOne({ _id: trip.driver_id }, { status: 'on_trip' }) : null,
    ]);

    // Update shipment statuses
    if (trip.shipment_ids?.length) {
      await Shipment.updateMany(
        { _id: { $in: trip.shipment_ids } },
        { status: 'in_transit', vehicle_number: trip.vehicle_number, driver_name: trip.driver_name }
      );
    }

    // Mark queue items as dispatched
    if (trip.lr_numbers?.length) {
      await DispatchQueue.updateMany(
        { lr_number: { $in: trip.lr_numbers }, company_id: req.user.company_id },
        { status: 'dispatched', dispatched_at: new Date() }
      );
    }

    await auditLog({ company_id: req.user.company_id, user: req.user, action: 'trip_start', resource: 'Trip', resource_id: trip._id });
    res.json({ success: true, trip });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/dispatch/complete-trip ────────────────────────────────────────
router.post('/complete-trip', auth, async (req, res) => {
  try {
    const { trip_id, odometer_end, fuel_consumed_l, actual_fuel_cost } = req.body;
    if (!trip_id) return res.status(400).json({ error: 'trip_id required' });

    const trip = await Trip.findOne({ _id: trip_id, company_id: req.user.company_id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const now = new Date();
    trip.status       = 'completed';
    trip.actual_end   = now;
    if (odometer_end)     trip.odometer_end     = odometer_end;
    if (fuel_consumed_l)  trip.fuel_consumed_l  = fuel_consumed_l;
    if (actual_fuel_cost) trip.fuel_cost         = actual_fuel_cost;
    if (odometer_end && trip.odometer_start)
      trip.total_distance_km = odometer_end - trip.odometer_start;
    await trip.save();

    // Release vehicle and driver
    await Promise.all([
      trip.vehicle_id ? FleetVehicle.updateOne({ _id: trip.vehicle_id }, {
        status: 'available', status_since: now,
        current_driver_id: null, current_driver_name: null,
        $inc: { total_trips: 1, total_km: trip.total_distance_km || 0 },
      }) : null,
      trip.driver_id ? Driver.updateOne({ _id: trip.driver_id }, { status: 'available', current_vehicle_id: null }) : null,
    ]);

    if (trip.dispatch_plan_id) {
      await DispatchPlan.updateOne({ _id: trip.dispatch_plan_id }, { status: 'completed' });
    }
    if (trip.manifest_id) {
      await DispatchManifest.updateOne({ _id: trip.manifest_id }, { status: 'completed', completed_at: now });
    }

    await auditLog({ company_id: req.user.company_id, user: req.user, action: 'trip_complete', resource: 'Trip', resource_id: trip._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/dispatch/report-issue ─────────────────────────────────────────
router.post('/report-issue', auth, async (req, res) => {
  try {
    const { trip_id, exception_type, description, location, lat, lng, severity = 'high' } = req.body;
    if (!trip_id || !exception_type) return res.status(400).json({ error: 'trip_id and exception_type required' });

    const trip = await Trip.findOne({ _id: trip_id, company_id: req.user.company_id }).lean();
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    // Get AI resolution
    const aiResolution = await getExceptionResolution({ exceptionType: exception_type, trip, companyId: req.user.company_id });

    const exception = await DispatchException.create({
      company_id:   req.user.company_id,
      trip_id,
      dispatch_plan_id: trip.dispatch_plan_id,
      exception_type,
      severity:     aiResolution.severity_assessment || severity,
      description,
      location, lat, lng,
      ai_actions:      aiResolution.ai_actions || [],
      ai_recommendation: aiResolution.recommendation,
      status:       'open',
      reported_by:  req.user._id,
    });

    // Mark trip as exception
    await Trip.updateOne({ _id: trip_id }, { has_exception: true, $push: { exception_ids: exception._id } });
    if (aiResolution.escalate) {
      await Trip.updateOne({ _id: trip_id }, { status: 'exception' });
    }

    res.status(201).json({ exception, ai_resolution: aiResolution });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/dispatch/recalculate ──────────────────────────────────────────
// Re-run AI optimization for a specific plan (e.g. after exception)
router.post('/recalculate', auth, async (req, res) => {
  try {
    const { plan_id, origin_lat, origin_lng } = req.body;
    if (!plan_id) return res.status(400).json({ error: 'plan_id required' });

    const plan = await DispatchPlan.findOne({ _id: plan_id, company_id: req.user.company_id });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const queueItems = await DispatchQueue.find({ _id: { $in: plan.queue_ids }, company_id: req.user.company_id }).lean();
    if (!queueItems.length) return res.status(400).json({ error: 'No queue items found for this plan' });

    const [newPlan] = await buildDispatchPlans({
      companyId:     req.user.company_id,
      queueItems,
      originLat:     origin_lat  || 18.5204,
      originLng:     origin_lng  || 73.8567,
      originAddress: plan.origin_address,
    });

    if (!newPlan) return res.status(500).json({ error: 'Recalculation failed' });

    Object.assign(plan, {
      recommended_vehicle_id:  newPlan.best_vehicle?._id,
      recommended_vehicle_num: newPlan.best_vehicle?.vehicle_number,
      recommended_driver_id:   newPlan.best_driver?._id,
      recommended_driver_name: newPlan.best_driver?.name,
      vehicle_id:     newPlan.best_vehicle?._id,
      vehicle_number: newPlan.best_vehicle?.vehicle_number,
      driver_id:      newPlan.best_driver?._id,
      driver_name:    newPlan.best_driver?.name,
      ai_confidence:  newPlan.ai_confidence,
      ai_reasoning:   newPlan.ai_reasoning,
      ai_risks:       newPlan.ai_risks,
      planned_dispatch_time: newPlan.planned_dispatch_time,
    });
    await plan.save();

    res.json({ success: true, plan, recalculated: newPlan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/dispatch/live ───────────────────────────────────────────────────
// Real-time dispatcher workspace data
router.get('/live', auth, async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const [queueSummary, activeTrips, availableVehicles, availableDrivers, openExceptions, recentPlans] = await Promise.all([
      DispatchQueue.aggregate([
        { $match: { company_id: new mongoose.Types.ObjectId(companyId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Trip.find({ company_id: companyId, status: { $in: ['planned','approved','loading','in_progress'] } })
        .select('trip_number status vehicle_number driver_name planned_start actual_start total_stops lr_numbers has_exception')
        .sort({ planned_start: 1 })
        .limit(30)
        .lean(),
      FleetVehicle.find({ company_id: companyId, is_active: true, status: { $in: ['available','idle'] } })
        .select('vehicle_number vehicle_type capacity_tons status health_score fuel_level_pct')
        .lean(),
      Driver.find({ company_id: companyId, is_active: true, status: 'available' })
        .select('name phone status')
        .lean(),
      DispatchException.find({ company_id: companyId, status: 'open' }).sort({ createdAt: -1 }).limit(10).lean(),
      DispatchPlan.find({ company_id: companyId, status: 'draft' }).sort({ createdAt: -1 }).limit(10)
        .select('plan_number lr_numbers vehicle_number driver_name ai_confidence total_stops status planned_dispatch_time')
        .lean(),
    ]);

    const queueCounts = queueSummary.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {});

    res.json({
      queue_counts:       queueCounts,
      active_trips:       activeTrips,
      available_vehicles: availableVehicles,
      available_drivers:  availableDrivers,
      open_exceptions:    openExceptions,
      pending_plans:      recentPlans,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/dispatch/calendar ──────────────────────────────────────────────
router.get('/calendar', auth, async (req, res) => {
  try {
    const { start, end } = req.query;
    const from = start ? new Date(start) : new Date(Date.now() - 7 * 86400000);
    const to   = end   ? new Date(end)   : new Date(Date.now() + 7 * 86400000);

    const trips = await Trip.find({
      company_id:    req.user.company_id,
      planned_start: { $gte: from, $lte: to },
    }).select('trip_number status vehicle_number driver_name planned_start planned_end total_stops').lean();

    const events = trips.map(t => ({
      id:       t._id,
      title:    `${t.trip_number} — ${t.vehicle_number || 'No vehicle'} (${t.total_stops || 1} stops)`,
      start:    t.planned_start,
      end:      t.planned_end,
      status:   t.status,
      driver:   t.driver_name,
    }));

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/dispatch/analytics ─────────────────────────────────────────────
router.get('/analytics', auth, async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 86400000);

    const [tripAgg, planAgg, queueAgg, exceptionAgg, dailyVolume] = await Promise.all([
      Trip.aggregate([
        { $match: { company_id: new mongoose.Types.ObjectId(companyId), createdAt: { $gte: since } } },
        { $group: {
          _id:          null,
          total_trips:  { $sum: 1 },
          completed:    { $sum: { $cond: [{ $eq: ['$status','completed'] }, 1, 0] } },
          with_exception: { $sum: { $cond: ['$has_exception', 1, 0] } },
          avg_km:       { $avg: '$total_distance_km' },
          total_km:     { $sum: '$total_distance_km' },
          avg_fuel_cost:{ $avg: '$fuel_cost' },
          total_shipments: { $sum: { $size: { $ifNull: ['$shipment_ids', []] } } },
        }},
      ]),
      DispatchPlan.aggregate([
        { $match: { company_id: new mongoose.Types.ObjectId(companyId), createdAt: { $gte: since } } },
        { $group: {
          _id:             null,
          total_plans:     { $sum: 1 },
          avg_confidence:  { $avg: '$ai_confidence' },
          manual_override: { $sum: { $cond: ['$is_manual_override', 1, 0] } },
          avg_utilization: { $avg: '$utilization_pct' },
        }},
      ]),
      DispatchQueue.aggregate([
        { $match: { company_id: new mongoose.Types.ObjectId(companyId), createdAt: { $gte: since } } },
        { $group: {
          _id:        null,
          total:      { $sum: 1 },
          dispatched: { $sum: { $cond: [{ $eq: ['$status','dispatched'] }, 1, 0] } },
          delayed:    { $sum: { $cond: [{ $eq: ['$status','delayed'] }, 1, 0] } },
          cancelled:  { $sum: { $cond: [{ $eq: ['$status','cancelled'] }, 1, 0] } },
        }},
      ]),
      DispatchException.aggregate([
        { $match: { company_id: new mongoose.Types.ObjectId(companyId), createdAt: { $gte: since } } },
        { $group: {
          _id:      '$exception_type',
          count:    { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status','resolved'] }, 1, 0] } },
        }},
        { $sort: { count: -1 } },
      ]),
      // Daily trip volume for last 7 days
      Trip.aggregate([
        { $match: { company_id: new mongoose.Types.ObjectId(companyId), createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          trips: { $sum: 1 },
          shipments: { $sum: { $size: { $ifNull: ['$shipment_ids', []] } } },
        }},
        { $sort: { _id: 1 } },
      ]),
    ]);

    const ta = tripAgg[0]   || {};
    const pa = planAgg[0]   || {};
    const qa = queueAgg[0]  || {};

    res.json({
      period_days: Number(days),
      trips:       ta,
      plans:       pa,
      queue:       qa,
      sla_compliance_pct: qa.total > 0 ? Math.round(((qa.dispatched) / qa.total) * 100) : 0,
      ai_acceptance_rate: pa.total_plans > 0 ? Math.round(((pa.total_plans - pa.manual_override) / pa.total_plans) * 100) : 0,
      exceptions_by_type: exceptionAgg,
      daily_volume:       dailyVolume,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/dispatch/trips ──────────────────────────────────────────────────
router.get('/trips', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status) filter.status = status;

    const [trips, total] = await Promise.all([
      Trip.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('vehicle_id', 'vehicle_number vehicle_type health_score')
        .populate('driver_id', 'name phone')
        .lean(),
      Trip.countDocuments(filter),
    ]);

    res.json({ trips, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/dispatch/trips/:id ─────────────────────────────────────────────
router.get('/trips/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('vehicle_id', 'vehicle_number vehicle_type capacity_tons health_score fuel_level_pct')
      .populate('driver_id',  'name phone license_number status')
      .lean();
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const [manifest, checklist, exceptions] = await Promise.all([
      trip.manifest_id ? DispatchManifest.findById(trip.manifest_id).lean() : null,
      LoadingChecklist.findOne({ trip_id: trip._id }).lean(),
      DispatchException.find({ trip_id: trip._id }).lean(),
    ]);

    res.json({ ...trip, manifest, checklist, exceptions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/dispatch/plans ──────────────────────────────────────────────────
router.get('/plans', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status) filter.status = status;

    const [plans, total] = await Promise.all([
      DispatchPlan.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).lean(),
      DispatchPlan.countDocuments(filter),
    ]);
    res.json({ plans, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/dispatch/checklist/:trip_id ───────────────────────────────────
router.patch('/checklist/:trip_id', auth, async (req, res) => {
  try {
    const { items, vehicle_checks, overall_status } = req.body;
    const checklist = await LoadingChecklist.findOneAndUpdate(
      { trip_id: req.params.trip_id, company_id: req.user.company_id },
      { items, vehicle_checks, overall_status,
        completed_at: overall_status === 'complete' ? new Date() : undefined,
        completed_by: req.user._id },
      { new: true }
    );
    if (!checklist) return res.status(404).json({ error: 'Checklist not found' });

    // If loading complete — update trip status
    if (overall_status === 'complete') {
      await Trip.updateOne({ _id: req.params.trip_id }, { status: 'loading' });
      await DispatchQueue.updateMany(
        { trip_id: req.params.trip_id, company_id: req.user.company_id },
        { status: 'loading' }
      );
    }
    res.json(checklist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Phase 6 Enterprise Enhancements — Acknowledgement, Replan, Impact, Shifts,
// Performance, Supervisor Approval
// ════════════════════════════════════════════════════════════════════════════

// ─── POST /api/dispatch/acknowledge ───────────────────────────────────────────
router.post('/acknowledge', auth, async (req, res) => {
  try {
    const { trip_id, driver_id, signature_data } = req.body;
    if (!trip_id) return res.status(400).json({ error: 'trip_id required' });
    const result = await acknowledgeTrip({ companyId: req.user.company_id, tripId: trip_id, driverId: driver_id, signatureData: signature_data });
    if (!result.success) return res.status(400).json({ error: result.error });
    await auditLog({ company_id: req.user.company_id, user: req.user, action: 'trip_acknowledged', resource: 'Trip', resource_id: trip_id });
    res.json(result.trip);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/dispatch/replan ────────────────────────────────────────────────
router.post('/replan', auth, async (req, res) => {
  try {
    const { trip_id, reason } = req.body;
    if (!trip_id || !reason) return res.status(400).json({ error: 'trip_id and reason required' });
    const result = await autoReplan({ companyId: req.user.company_id, tripId: trip_id, reason, user: req.user });
    if (!result.success) return res.status(404).json({ error: result.error });
    await auditLog({ company_id: req.user.company_id, user: req.user, action: 'trip_replanned', resource: 'Trip', resource_id: trip_id });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/dispatch/impact ─────────────────────────────────────────────────
router.get('/impact', auth, async (req, res) => {
  try {
    const { trip_id, days = 7 } = req.query;
    const filter = { company_id: req.user.company_id, createdAt: { $gte: new Date(Date.now() - days * 86400000) } };
    if (trip_id) filter.trip_id = trip_id;
    const impacts = await DispatchImpact.find(filter).sort('-createdAt').limit(50).lean();
    res.json({ impacts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/impact', auth, async (req, res) => {
  try {
    const { trip_id, dispatch_plan_id, change_type, change_reason, eta_delay_min } = req.body;
    if (!change_type) return res.status(400).json({ error: 'change_type required' });
    const impact = await analyzeCustomerImpact({ companyId: req.user.company_id, tripId: trip_id, dispatchPlanId: dispatch_plan_id, changeType: change_type, changeReason: change_reason, etaDelayMin: eta_delay_min });
    res.status(201).json(impact);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/dispatch/performance ────────────────────────────────────────────
router.get('/performance', auth, async (req, res) => {
  try {
    const { dispatcher_id, days = 30 } = req.query;
    const performance = await getDispatcherPerformance(req.user.company_id, { dispatcherId: dispatcher_id, days: Number(days) });
    res.json({ performance });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/dispatch/shifts ──────────────────────────────────────────────────
router.get('/shifts', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status) filter.status = status;
    const shifts = await DispatcherShift.find(filter).sort('-shift_start').limit(50).lean();
    res.json({ shifts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/shifts/start', auth, async (req, res) => {
  try {
    const shift = await startShift({ companyId: req.user.company_id, branchId: req.user.branch_id, dispatcherId: req.user._id, dispatcherName: req.user.name });
    res.status(201).json(shift);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/shifts/:id/handover', auth, async (req, res) => {
  try {
    const { handover_notes, handed_over_to, handed_over_to_name } = req.body;
    const shift = await handoverShift({ companyId: req.user.company_id, shiftId: req.params.id, handoverNotes: handover_notes, handedOverTo: handed_over_to, handedOverToName: handed_over_to_name });
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    res.json(shift);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/dispatch/approve ────────────────────────────────────────────────
// Supervisor approval workflow for high-value / high-risk dispatch plans.
router.post('/approve', auth, async (req, res) => {
  try {
    const { approval_id, dispatch_plan_id, value_amount, risk_notes, approve, comment } = req.body;

    if (approval_id) {
      const approval = await reviewApproval({ companyId: req.user.company_id, approvalId: approval_id, approve: !!approve, reviewer: req.user, comment });
      if (!approval) return res.status(404).json({ error: 'Approval request not found' });
      await auditLog({ company_id: req.user.company_id, user: req.user, action: approve ? 'dispatch_plan_approved' : 'dispatch_plan_rejected', resource: 'DispatchApproval', resource_id: approval._id });
      return res.json(approval);
    }

    if (!dispatch_plan_id) return res.status(400).json({ error: 'approval_id or dispatch_plan_id required' });
    if (!requiresApproval({ valueAmount: value_amount, isHighRisk: !!risk_notes })) {
      return res.status(400).json({ error: 'This dispatch plan does not require supervisor approval' });
    }
    const approval = await requestApproval({ companyId: req.user.company_id, dispatchPlanId: dispatch_plan_id, reason: value_amount ? 'high_value' : 'high_risk', valueAmount: value_amount, riskNotes: risk_notes, requestedBy: req.user._id, requestedByName: req.user.name });
    res.status(201).json(approval);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/approvals', auth, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const approvals = await DispatchApproval.find({ company_id: req.user.company_id, status }).populate('dispatch_plan_id').sort('-createdAt').lean();
    res.json({ approvals });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
