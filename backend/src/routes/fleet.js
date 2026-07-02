const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');

const { authenticate: auth } = require('../middleware/auth');
const { log: auditLog }      = require('../utils/audit');
const { computeHealthScore, GRADE } = require('../utils/healthScorer');
const { getFleetAlerts, scheduleMaintenanceForAlerts } = require('../utils/maintenanceEngine');
const { findBestVehicles, getAIFleetRecommendation, getAIPredictiveMaintenance } = require('../utils/fleetAdvisor');

const FleetVehicle       = require('../models/FleetVehicle');
const VehicleMaintenance = require('../models/VehicleMaintenance');
const VehicleFuel        = require('../models/VehicleFuel');
const VehicleDocument    = require('../models/VehicleDocument');
const VehicleAssignment  = require('../models/VehicleAssignment');
const VehicleHealth      = require('../models/VehicleHealth');
const VehicleInspection  = require('../models/VehicleInspection');
const VehicleExpense     = require('../models/VehicleExpense');
const FleetAnalytics     = require('../models/FleetAnalytics');
const Tyre                = require('../models/Tyre');
const Vendor               = require('../models/Vendor');
const { PartInventory, PartReservation } = require('../models/PartInventory');
const EVCharging           = require('../models/EVCharging');
const { validateOdometer, forecastFleetBudget } = require('../utils/fleetForecast');

// ─── GET /api/fleet ───────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status, branch_id, vehicle_type, search, page = 1, limit = 50 } = req.query;
    const filter = { company_id: req.user.company_id, is_active: true };

    if (status)       filter.status = status;
    if (branch_id)    filter.branch_id = branch_id;
    if (vehicle_type) filter.vehicle_type = vehicle_type;
    if (search) {
      filter.$or = [
        { vehicle_number:      { $regex: search, $options: 'i' } },
        { registration_number: { $regex: search, $options: 'i' } },
        { manufacturer:        { $regex: search, $options: 'i' } },
        { current_driver_name: { $regex: search, $options: 'i' } },
      ];
    }

    const [vehicles, total] = await Promise.all([
      FleetVehicle.find(filter)
        .sort({ status: 1, health_score: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('current_driver_id', 'name phone status')
        .lean(),
      FleetVehicle.countDocuments(filter),
    ]);

    // Fleet summary counts
    const summary = await FleetVehicle.aggregate([
      { $match: { company_id: new mongoose.Types.ObjectId(req.user.company_id), is_active: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusCounts = summary.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {});

    res.json({ vehicles, total, page: Number(page), pages: Math.ceil(total / limit), status_counts: statusCounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/fleet/available ─────────────────────────────────────────────────
router.get('/available', auth, async (req, res) => {
  try {
    const { weight_tons = 0, volume_cbm = 0, vehicle_type, origin_lat, origin_lng, priority } = req.query;
    const requirements = {
      weight_tons:  Number(weight_tons),
      volume_cbm:   Number(volume_cbm),
      vehicle_type: vehicle_type || undefined,
      origin_lat:   origin_lat ? Number(origin_lat) : undefined,
      origin_lng:   origin_lng ? Number(origin_lng) : undefined,
      priority,
    };

    const candidates = await findBestVehicles(req.user.company_id, requirements);

    // Fleet stats for AI context
    const summary = await FleetVehicle.aggregate([
      { $match: { company_id: new mongoose.Types.ObjectId(req.user.company_id), is_active: true } },
      { $group: {
        _id: null,
        total:       { $sum: 1 },
        available:   { $sum: { $cond: [{ $in: ['$status', ['available','idle']] }, 1, 0] } },
        on_trip:     { $sum: { $cond: [{ $eq: ['$status', 'on_trip'] }, 1, 0] } },
        maintenance: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } },
        avg_health:  { $avg: '$health_score' },
      }},
    ]);
    const fleetStats = summary[0] || { total: 0, available: 0, on_trip: 0, maintenance: 0, avg_health: 0 };

    const aiResult = await getAIFleetRecommendation({ vehicles: candidates, requirements, fleetStats });

    res.json({
      candidates,
      ai: aiResult,
      fleet_stats: fleetStats,
      best: candidates[aiResult.best_vehicle_index ?? 0] || candidates[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/fleet/alerts ────────────────────────────────────────────────────
router.get('/alerts', auth, async (req, res) => {
  try {
    const alerts = await getFleetAlerts(req.user.company_id);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/fleet/maintenance ───────────────────────────────────────────────
router.get('/maintenance', auth, async (req, res) => {
  try {
    const { status, fleet_vehicle_id, page = 1, limit = 30 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status)           filter.status = status;
    if (fleet_vehicle_id) filter.fleet_vehicle_id = fleet_vehicle_id;

    const [records, total] = await Promise.all([
      VehicleMaintenance.find(filter)
        .sort({ scheduled_date: 1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      VehicleMaintenance.countDocuments(filter),
    ]);
    res.json({ records, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/fleet/analytics ─────────────────────────────────────────────────
router.get('/analytics', auth, async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 86400000);

    const [vehicleStats, fuelStats, maintenanceCosts, expenseBreakdown, utilizationByType, healthDistribution] = await Promise.all([
      // Fleet overview
      FleetVehicle.aggregate([
        { $match: { company_id: new mongoose.Types.ObjectId(companyId), is_active: true } },
        { $group: {
          _id:          null,
          total:        { $sum: 1 },
          avg_health:   { $avg: '$health_score' },
          avg_age:      { $avg: { $subtract: [new Date().getFullYear(), { $ifNull: ['$year', 2018] }] } },
          total_km:     { $sum: '$total_km' },
          total_trips:  { $sum: '$total_trips' },
          owned:        { $sum: { $cond: [{ $eq: ['$ownership_type','owned'] }, 1, 0] } },
          leased:       { $sum: { $cond: [{ $eq: ['$ownership_type','leased'] }, 1, 0] } },
          breakdown_total: { $sum: '$breakdown_count' },
        }},
      ]),

      // Fuel summary
      VehicleFuel.aggregate([
        { $match: { company_id: new mongoose.Types.ObjectId(companyId), filling_date: { $gte: since } } },
        { $group: {
          _id:            null,
          total_liters:   { $sum: '$liters_filled' },
          total_cost:     { $sum: '$total_cost' },
          avg_mileage:    { $avg: '$mileage_kmpl' },
          fill_count:     { $sum: 1 },
          suspicious:     { $sum: { $cond: ['$is_suspicious', 1, 0] } },
        }},
      ]),

      // Maintenance costs
      VehicleMaintenance.aggregate([
        { $match: { company_id: new mongoose.Types.ObjectId(companyId), status: 'completed', completed_date: { $gte: since } } },
        { $group: { _id: null, total_cost: { $sum: '$cost' }, count: { $sum: 1 } } },
      ]),

      // Expense by type
      VehicleExpense.aggregate([
        { $match: { company_id: new mongoose.Types.ObjectId(companyId), expense_date: { $gte: since } } },
        { $group: { _id: '$expense_type', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]),

      // Utilization by vehicle type
      FleetVehicle.aggregate([
        { $match: { company_id: new mongoose.Types.ObjectId(companyId), is_active: true } },
        { $group: {
          _id:        '$vehicle_type',
          count:      { $sum: 1 },
          avg_health: { $avg: '$health_score' },
          total_trips:{ $sum: '$total_trips' },
          on_trip:    { $sum: { $cond: [{ $eq: ['$status','on_trip'] }, 1, 0] } },
        }},
      ]),

      // Health distribution
      FleetVehicle.aggregate([
        { $match: { company_id: new mongoose.Types.ObjectId(companyId), is_active: true } },
        { $group: { _id: '$health_grade', count: { $sum: 1 } } },
      ]),
    ]);

    const vs = vehicleStats[0] || {};
    const fs = fuelStats[0] || {};
    const mc = maintenanceCosts[0] || {};
    const totalExpenses = expenseBreakdown.reduce((s, e) => s + e.total, 0);

    res.json({
      period_days: Number(days),
      fleet: {
        ...vs,
        utilization_pct: vs.total > 0
          ? parseFloat(((vs.total_trips / Math.max(vs.total * days / 7, 1)) * 100).toFixed(1))
          : 0,
      },
      fuel:         fs,
      maintenance:  mc,
      expense_breakdown: expenseBreakdown,
      total_expenses: totalExpenses,
      cost_per_km: vs.total_km > 0 ? parseFloat((totalExpenses / vs.total_km).toFixed(2)) : 0,
      by_vehicle_type: utilizationByType,
      health_distribution: healthDistribution,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/fleet/health ────────────────────────────────────────────────────
router.get('/health', auth, async (req, res) => {
  try {
    const vehicles = await FleetVehicle.find({
      company_id: req.user.company_id,
      is_active:  true,
    }).lean();

    const healthData = await Promise.all(
      vehicles.map(async v => {
        const latest = await VehicleHealth.findOne({ fleet_vehicle_id: v._id }).sort({ assessed_at: -1 }).lean();
        return { vehicle_number: v.vehicle_number, vehicle_id: v._id, health: latest || { score: v.health_score, grade: v.health_grade } };
      })
    );

    res.json(healthData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/fleet ──────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const data = { ...req.body, company_id: req.user.company_id, branch_id: req.user.branch_id };

    // Prevent duplicate vehicle numbers per company
    const exists = await FleetVehicle.findOne({ company_id: data.company_id, vehicle_number: data.vehicle_number?.toUpperCase() });
    if (exists) return res.status(409).json({ error: 'Vehicle number already registered in this company' });

    const vehicle = await FleetVehicle.create(data);

    await auditLog({ company_id: req.user.company_id, user: req.user, action: 'fleet_vehicle_create', resource: 'FleetVehicle', resource_id: vehicle._id });

    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/fleet/:id ───────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const vehicle = await FleetVehicle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/fleet/:id (soft delete) ─────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await FleetVehicle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { is_active: false, status: 'out_of_service' }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/fleet/documents ─────────────────────────────────────────────────
router.get('/documents', auth, async (req, res) => {
  try {
    const { fleet_vehicle_id, doc_type, expiring_days } = req.query;
    const filter = { company_id: req.user.company_id };
    if (fleet_vehicle_id) filter.fleet_vehicle_id = fleet_vehicle_id;
    if (doc_type) filter.doc_type = doc_type;
    if (expiring_days) {
      const cutoff = new Date(Date.now() + Number(expiring_days) * 86400000);
      filter.expiry_date = { $lte: cutoff, $gte: new Date() };
    }

    const docs = await VehicleDocument.find(filter).sort({ expiry_date: 1 }).lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Vendor Management ────────────────────────────────────────────────────────
router.get('/vendors', auth, async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { company_id: req.user.company_id, is_active: true };
    if (type) filter.type = type;
    const vendors = await Vendor.find(filter).sort('-is_preferred -rating').lean();
    res.json({ vendors });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/fleet/:id ───────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const vehicle = await FleetVehicle.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('current_driver_id', 'name phone license_number status')
      .lean();
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Attach latest health, recent maintenance, recent fuel
    const [latestHealth, recentMaintenance, recentFuel, recentAssignments] = await Promise.all([
      VehicleHealth.findOne({ fleet_vehicle_id: vehicle._id }).sort({ assessed_at: -1 }).lean(),
      VehicleMaintenance.find({ fleet_vehicle_id: vehicle._id }).sort({ scheduled_date: -1 }).limit(5).lean(),
      VehicleFuel.find({ fleet_vehicle_id: vehicle._id }).sort({ filling_date: -1 }).limit(5).lean(),
      VehicleAssignment.find({ fleet_vehicle_id: vehicle._id }).sort({ assigned_at: -1 }).limit(5)
        .populate('driver_id', 'name phone').lean(),
    ]);

    res.json({ ...vehicle, latest_health: latestHealth, recent_maintenance: recentMaintenance, recent_fuel: recentFuel, recent_assignments: recentAssignments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/fleet/assign ───────────────────────────────────────────────────
router.post('/assign', auth, async (req, res) => {
  try {
    const { fleet_vehicle_id, driver_id, shipment_id, route_id, assignment_type = 'trip', odometer_start, start_location, notes } = req.body;
    if (!fleet_vehicle_id) return res.status(400).json({ error: 'fleet_vehicle_id required' });

    const vehicle = await FleetVehicle.findOne({ _id: fleet_vehicle_id, company_id: req.user.company_id });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Release any existing open assignment
    await VehicleAssignment.updateMany(
      { fleet_vehicle_id, company_id: req.user.company_id, released_at: null },
      { released_at: new Date() }
    );

    let driverName, driverPhone;
    if (driver_id) {
      const Driver = require('../models/Driver');
      const driver = await Driver.findById(driver_id).lean();
      driverName  = driver?.name;
      driverPhone = driver?.phone;
      await Driver.updateOne({ _id: driver_id }, { status: 'on_trip', current_vehicle_id: vehicle._id });
    }

    const assignment = await VehicleAssignment.create({
      company_id:       req.user.company_id,
      fleet_vehicle_id,
      driver_id,
      shipment_id,
      route_id,
      vehicle_number:   vehicle.vehicle_number,
      driver_name:      driverName,
      driver_phone:     driverPhone,
      assigned_by:      req.user._id,
      is_ai_assigned:   req.body.is_ai_assigned || false,
      assignment_type,
      odometer_start:   odometer_start || vehicle.odometer_km,
      start_location,
      notes,
    });

    // Update vehicle status
    await FleetVehicle.updateOne({ _id: fleet_vehicle_id }, {
      status:              'assigned',
      status_since:        new Date(),
      current_driver_id:   driver_id   || null,
      current_driver_name: driverName  || null,
    });

    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/fleet/release ──────────────────────────────────────────────────
router.post('/release', auth, async (req, res) => {
  try {
    const { fleet_vehicle_id, odometer_end, end_location, trip_revenue, trip_fuel_cost, driver_rating, notes } = req.body;
    if (!fleet_vehicle_id) return res.status(400).json({ error: 'fleet_vehicle_id required' });

    const vehicle = await FleetVehicle.findOne({ _id: fleet_vehicle_id, company_id: req.user.company_id });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const openAssignment = await VehicleAssignment.findOne({ fleet_vehicle_id, company_id: req.user.company_id, released_at: null });

    if (openAssignment) {
      const km = odometer_end && openAssignment.odometer_start ? odometer_end - openAssignment.odometer_start : 0;
      Object.assign(openAssignment, {
        released_at:   new Date(),
        odometer_end,
        end_location,
        km_driven:     km,
        trip_revenue,
        trip_fuel_cost,
        driver_rating,
        notes,
      });
      await openAssignment.save();

      // Update vehicle stats
      const update = {
        status:              'available',
        status_since:        new Date(),
        current_driver_id:   null,
        current_driver_name: null,
        $inc: { total_trips: 1, total_km: km || 0, total_revenue: trip_revenue || 0, total_expenses: trip_fuel_cost || 0 },
      };
      if (odometer_end) update.odometer_km = odometer_end;
      await FleetVehicle.updateOne({ _id: fleet_vehicle_id }, update);

      // Release driver
      if (openAssignment.driver_id) {
        const Driver = require('../models/Driver');
        await Driver.updateOne({ _id: openAssignment.driver_id }, { status: 'available', current_vehicle_id: null });
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/fleet/maintenance ─────────────────────────────────────────────
router.post('/maintenance', auth, async (req, res) => {
  try {
    const data = { ...req.body, company_id: req.user.company_id, created_by: req.user._id };
    const record = await VehicleMaintenance.create(data);

    if (req.body.status === 'in_progress') {
      await FleetVehicle.updateOne({ _id: req.body.fleet_vehicle_id }, { status: 'maintenance', status_since: new Date() });
    }
    if (req.body.status === 'completed') {
      await FleetVehicle.updateOne({ _id: req.body.fleet_vehicle_id }, { status: 'available', status_since: new Date() });
      // Log expense
      if (req.body.cost > 0) {
        await VehicleExpense.create({
          company_id:       req.user.company_id,
          fleet_vehicle_id: req.body.fleet_vehicle_id,
          vehicle_number:   req.body.vehicle_number,
          expense_type:     'maintenance',
          amount:           req.body.cost,
          expense_date:     req.body.completed_date || new Date(),
          description:      req.body.maintenance_type,
          vendor:           req.body.vendor_name,
          created_by:       req.user._id,
        });
      }
    }

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/fleet/maintenance/auto-schedule ───────────────────────────────
router.post('/maintenance/auto-schedule', auth, async (req, res) => {
  try {
    const created = await scheduleMaintenanceForAlerts(req.user.company_id, req.user._id);
    res.json({ success: true, scheduled: created.length, records: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/fleet/fuel ─────────────────────────────────────────────────────
router.post('/fuel', auth, async (req, res) => {
  try {
    const { fleet_vehicle_id, liters_filled, price_per_liter, odometer_after } = req.body;

    const vehicle = await FleetVehicle.findOne({ _id: fleet_vehicle_id, company_id: req.user.company_id }).lean();
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Calculate mileage
    const lastFuel = await VehicleFuel.findOne({ fleet_vehicle_id }).sort({ filling_date: -1 }).lean();
    const distSinceLast = odometer_after && lastFuel?.odometer_after
      ? odometer_after - lastFuel.odometer_after : null;
    const mileage = distSinceLast && liters_filled ? parseFloat((distSinceLast / liters_filled).toFixed(2)) : null;

    // Fuel theft detection: mileage anomaly
    const expectedMileage = vehicle.fuel_type === 'cng' ? 12 : { truck: 8, mini_truck: 12, tempo: 14 }[vehicle.vehicle_type] || 10;
    const isSuspicious = mileage !== null && mileage < expectedMileage * 0.4;

    const total_cost = liters_filled * (price_per_liter || 0);

    const record = await VehicleFuel.create({
      company_id:       req.user.company_id,
      fleet_vehicle_id,
      vehicle_number:   vehicle.vehicle_number,
      driver_id:        req.body.driver_id || vehicle.current_driver_id,
      driver_name:      req.body.driver_name || vehicle.current_driver_name,
      filling_date:     req.body.filling_date || new Date(),
      fuel_type:        vehicle.fuel_type,
      liters_filled,
      price_per_liter,
      total_cost,
      odometer_before:  lastFuel?.odometer_after,
      odometer_after,
      distance_since_last: distSinceLast,
      mileage_kmpl:     mileage,
      filling_station:  req.body.filling_station,
      station_lat:      req.body.station_lat,
      station_lng:      req.body.station_lng,
      is_suspicious:    isSuspicious,
      suspicious_reason:isSuspicious ? `Low mileage: ${mileage} km/L vs expected ${expectedMileage} km/L` : null,
      notes:            req.body.notes,
      created_by:       req.user._id,
    });

    // Update vehicle fuel level and totals
    await FleetVehicle.updateOne({ _id: fleet_vehicle_id }, {
      fuel_level_pct: Math.min(100, ((vehicle.fuel_tank_liters || 100) > 0)
        ? Math.round((liters_filled / vehicle.fuel_tank_liters) * 100) : 100),
      $inc: { total_fuel_liters: liters_filled, total_expenses: total_cost },
    });

    // Log expense
    if (total_cost > 0) {
      await VehicleExpense.create({
        company_id: req.user.company_id, fleet_vehicle_id,
        vehicle_number: vehicle.vehicle_number,
        expense_type: 'fuel', amount: total_cost,
        expense_date: req.body.filling_date || new Date(),
        description: `${liters_filled}L fuel @ ₹${price_per_liter}/L`,
        created_by: req.user._id,
      });
    }

    res.status(201).json({ record, is_suspicious: isSuspicious });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/fleet/documents ────────────────────────────────────────────────
router.post('/documents', auth, async (req, res) => {
  try {
    const doc = await VehicleDocument.create({ ...req.body, company_id: req.user.company_id, created_by: req.user._id });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/fleet/inspection ───────────────────────────────────────────────
router.post('/inspection', auth, async (req, res) => {
  try {
    const inspection = await VehicleInspection.create({ ...req.body, company_id: req.user.company_id, inspected_by: req.user._id });

    // If inspection failed — flag vehicle
    if (inspection.overall_result === 'fail') {
      await FleetVehicle.updateOne({ _id: req.body.fleet_vehicle_id }, {
        status:        'maintenance',
        status_reason: `Failed ${inspection.inspection_type} inspection`,
        status_since:  new Date(),
        $push: { ai_flags: `Failed inspection: ${inspection.issues_found?.join(', ')}` },
      });
    }

    res.status(201).json(inspection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/fleet/:id/health-check ─────────────────────────────────────────
router.post('/:id/health-check', auth, async (req, res) => {
  try {
    const vehicle = await FleetVehicle.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const health = await computeHealthScore(vehicle);

    // Persist health record
    const healthRecord = await VehicleHealth.create({
      company_id:       req.user.company_id,
      fleet_vehicle_id: vehicle._id,
      vehicle_number:   vehicle.vehicle_number,
      ...health,
      assessed_at: new Date(),
    });

    // Update vehicle health score
    await FleetVehicle.updateOne({ _id: vehicle._id }, {
      health_score:       health.score,
      health_grade:       health.grade,
      last_health_update: new Date(),
      ai_flags:           health.ai_recommendations,
    });

    res.json(healthRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/fleet/:id/predictive-maintenance ───────────────────────────────
router.post('/:id/predictive-maintenance', auth, async (req, res) => {
  try {
    const vehicle = await FleetVehicle.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const [maintenanceHistory, fuelHistory] = await Promise.all([
      VehicleMaintenance.find({ fleet_vehicle_id: vehicle._id }).sort({ createdAt: -1 }).limit(20).lean(),
      VehicleFuel.find({ fleet_vehicle_id: vehicle._id }).sort({ filling_date: -1 }).limit(10).lean(),
    ]);

    const prediction = await getAIPredictiveMaintenance(vehicle, maintenanceHistory, fuelHistory);

    // Auto-create scheduled maintenance for high/critical predicted issues
    for (const issue of prediction.predicted_issues || []) {
      if (['high','critical'].includes(issue.urgency)) {
        const typeMap = {
          Engine: 'engine_oil', Brakes: 'brake_service', Tyres: 'tyre_replacement',
          Battery: 'battery', Suspension: 'suspension', General: 'general_service',
        };
        const mType = typeMap[issue.component] || 'general_service';
        const existing = await VehicleMaintenance.findOne({
          fleet_vehicle_id: vehicle._id, maintenance_type: mType, status: { $in: ['scheduled','in_progress'] },
        });
        if (!existing) {
          await VehicleMaintenance.create({
            company_id:        req.user.company_id,
            fleet_vehicle_id:  vehicle._id,
            vehicle_number:    vehicle.vehicle_number,
            maintenance_type:  mType,
            maintenance_category: 'predictive',
            status:            'scheduled',
            priority:          issue.urgency === 'critical' ? 'urgent' : 'high',
            scheduled_date:    new Date(Date.now() + (issue.estimated_days || 7) * 86400000),
            description:       issue.issue,
            is_ai_predicted:   true,
            ai_confidence:     issue.probability,
            created_by:        req.user._id,
          });
        }
      }
    }

    res.json(prediction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/fleet/:id/fuel-history ─────────────────────────────────────────
router.get('/:id/fuel-history', auth, async (req, res) => {
  try {
    const records = await VehicleFuel.find({ fleet_vehicle_id: req.params.id, company_id: req.user.company_id })
      .sort({ filling_date: -1 }).limit(30).lean();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/fleet/:id/assignments ──────────────────────────────────────────
router.get('/:id/assignments', auth, async (req, res) => {
  try {
    const records = await VehicleAssignment.find({ fleet_vehicle_id: req.params.id, company_id: req.user.company_id })
      .sort({ assigned_at: -1 }).limit(20)
      .populate('driver_id', 'name phone').lean();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/fleet/:id/expenses ─────────────────────────────────────────────
router.get('/:id/expenses', auth, async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const since = new Date(Date.now() - days * 86400000);
    const expenses = await VehicleExpense.find({
      fleet_vehicle_id: req.params.id,
      company_id: req.user.company_id,
      expense_date: { $gte: since },
    }).sort({ expense_date: -1 }).lean();

    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const by_type = expenses.reduce((acc, e) => { acc[e.expense_type] = (acc[e.expense_type] || 0) + e.amount; return acc; }, {});
    const cost_per_km = expenses.length > 0 ? null : null; // computed if odometer data present

    res.json({ expenses, total, by_type });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Phase 5 Enterprise Enhancements — Tyres, Parts, Vendors, EV, Forecasting
// ════════════════════════════════════════════════════════════════════════════

// ─── Tyre Lifecycle ───────────────────────────────────────────────────────────
router.get('/:vehicleId/tyres', auth, async (req, res) => {
  try {
    const tyres = await Tyre.find({ company_id: req.user.company_id, vehicle_id: req.params.vehicleId }).sort('-createdAt').lean();
    res.json({ tyres });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:vehicleId/tyres', auth, async (req, res) => {
  try {
    const tyre = await Tyre.create({ ...req.body, company_id: req.user.company_id, vehicle_id: req.params.vehicleId });
    await auditLog({ company_id: req.user.company_id, user: req.user, action: 'tyre_installed', resource: 'Tyre', resource_id: tyre._id });
    res.status(201).json(tyre);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/tyres/:id', auth, async (req, res) => {
  try {
    const tyre = await Tyre.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id }, req.body, { new: true }
    );
    if (!tyre) return res.status(404).json({ error: 'Tyre not found' });
    res.json(tyre);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/tyres/:id/rotate', auth, async (req, res) => {
  try {
    const { odometer_km, position } = req.body;
    const tyre = await Tyre.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { position, last_rotation_at: new Date(), last_rotation_odometer_km: odometer_km, $inc: { rotation_count: 1 } },
      { new: true }
    );
    if (!tyre) return res.status(404).json({ error: 'Tyre not found' });
    res.json(tyre);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/vendors', auth, async (req, res) => {
  try {
    const vendor = await Vendor.create({ ...req.body, company_id: req.user.company_id });
    res.status(201).json(vendor);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/vendors/:id', auth, async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndUpdate({ _id: req.params.id, company_id: req.user.company_id }, req.body, { new: true });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Parts Inventory ──────────────────────────────────────────────────────────
router.get('/parts', auth, async (req, res) => {
  try {
    const { category, low_stock } = req.query;
    const filter = { company_id: req.user.company_id, is_active: true };
    if (category) filter.category = category;
    let parts = await PartInventory.find(filter).populate('vendor_id', 'name type').sort('part_name').lean();
    if (low_stock === 'true') parts = parts.filter(p => (p.quantity_in_stock - p.quantity_reserved) <= p.reorder_level);
    res.json({ parts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/parts', auth, async (req, res) => {
  try {
    const part = await PartInventory.create({ ...req.body, company_id: req.user.company_id, last_restocked_at: new Date() });
    res.status(201).json(part);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/parts/:id/reserve', auth, async (req, res) => {
  try {
    const { quantity, vehicle_id, maintenance_id } = req.body;
    const part = await PartInventory.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!part) return res.status(404).json({ error: 'Part not found' });
    const available = part.quantity_in_stock - part.quantity_reserved;
    if (quantity > available) return res.status(400).json({ error: `Only ${available} units available` });

    part.quantity_reserved += quantity;
    await part.save();

    const reservation = await PartReservation.create({
      company_id: req.user.company_id, part_id: part._id, vehicle_id, maintenance_id,
      quantity, reserved_by: req.user._id,
    });
    res.status(201).json({ part, reservation });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── EV Fleet Support ─────────────────────────────────────────────────────────
router.get('/:vehicleId/ev-charging', auth, async (req, res) => {
  try {
    const logs = await EVCharging.find({ company_id: req.user.company_id, vehicle_id: req.params.vehicleId }).sort('-createdAt').limit(50).lean();
    res.json({ logs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:vehicleId/ev-charging', auth, async (req, res) => {
  try {
    const log = await EVCharging.create({ ...req.body, company_id: req.user.company_id, vehicle_id: req.params.vehicleId });
    res.status(201).json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Odometer Tampering Validation ────────────────────────────────────────────
router.post('/:vehicleId/validate-odometer', auth, async (req, res) => {
  try {
    const result = validateOdometer(req.body);
    if (!result.valid) {
      await auditLog({ company_id: req.user.company_id, user: req.user, action: 'odometer_anomaly_detected', resource: 'FleetVehicle', resource_id: req.params.vehicleId });
    }
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Fleet Forecasting & Lifecycle Dashboard ──────────────────────────────────
router.get('/forecast/budget', auth, async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const forecast = await forecastFleetBudget(req.user.company_id, Number(months));
    res.json(forecast);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:vehicleId/lifecycle', auth, async (req, res) => {
  try {
    const vehicle = await FleetVehicle.findOne({ _id: req.params.vehicleId, company_id: req.user.company_id }).lean();
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const [maintenance, expenses, tyres] = await Promise.all([
      VehicleMaintenance.find({ company_id: req.user.company_id, vehicle_id: req.params.vehicleId }).sort('-createdAt').lean(),
      VehicleExpense.find({ company_id: req.user.company_id, vehicle_id: req.params.vehicleId }).sort('-createdAt').lean(),
      Tyre.find({ company_id: req.user.company_id, vehicle_id: req.params.vehicleId }).lean(),
    ]);

    const totalMaintCost = maintenance.reduce((s, m) => s + (m.cost || 0), 0);
    const totalExpense   = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const ageYears = vehicle.purchase_date ? Math.round(((Date.now() - new Date(vehicle.purchase_date)) / (365 * 86400000)) * 10) / 10 : null;

    let retirement_recommendation = 'Keep in active service';
    if (ageYears > 8 || (vehicle.health_score != null && vehicle.health_score < 35)) {
      retirement_recommendation = 'Recommend retirement / replacement planning';
    } else if (ageYears > 6 || (vehicle.health_score != null && vehicle.health_score < 55)) {
      retirement_recommendation = 'Monitor closely; plan replacement within 12-18 months';
    }

    res.json({
      vehicle, age_years: ageYears,
      total_maintenance_cost: Math.round(totalMaintCost),
      total_operating_cost:   Math.round(totalMaintCost + totalExpense),
      maintenance_count: maintenance.length,
      active_tyres: tyres.filter(t => t.status === 'active').length,
      retirement_recommendation,
      maintenance_history: maintenance.slice(0, 10),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
