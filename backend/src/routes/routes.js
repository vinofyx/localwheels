const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');

const { authenticate: auth } = require('../middleware/auth');
const { log: logAudit }  = require('../utils/audit');
const { optimizeRoute, selectBestVehicle, selectBestDriver } = require('../utils/routeOptimizer');
const { haversine }      = require('../utils/trafficEngine');
const {
  recordRouteOutcome, getLearningInsights, checkDriverFatigue,
  getDockAvailability, reserveDockSlot, recommendFuelStations, calculateRouteRisk,
} = require('../utils/routeIntelligence');

const OptimizedRoute     = require('../models/OptimizedRoute');
const RouteHistory       = require('../models/RouteHistory');
const FuelConsumption    = require('../models/FuelConsumption');
const Shipment           = require('../models/Shipment');
const Vehicle            = require('../models/Vehicle');
const Driver             = require('../models/Driver');
// Notification model is optional — gracefully skip if absent

// ─── POST /api/routes/optimize ────────────────────────────────────────────────
// Core: run AI optimization for one or more shipments
router.post('/optimize', auth, async (req, res) => {
  try {
    const {
      shipment_ids,
      origin_lat,
      origin_lng,
      origin_address,
      optimization_type = 'ai_recommended',
      route_type        = 'single_stop',
      diesel_price,
      preferred_vehicle_id,
      preferred_driver_id,
    } = req.body;

    if (!shipment_ids?.length) return res.status(400).json({ error: 'shipment_ids required' });

    const result = await optimizeRoute({
      companyId:         req.user.company_id,
      shipmentIds:       shipment_ids,
      originLat:         origin_lat  || 18.5204,
      originLng:         origin_lng  || 73.8567,
      originAddress:     origin_address || 'Depot',
      optimizationType:  optimization_type,
      routeType:         route_type,
      dieselPrice:       diesel_price,
      preferredVehicleId: preferred_vehicle_id,
      preferredDriverId:  preferred_driver_id,
    });

    // Persist the optimized route
    const optimizedRoute = await OptimizedRoute.create({
      company_id:     req.user.company_id,
      branch_id:      req.user.branch_id,
      origin_address: origin_address || 'Depot',
      origin_lat:     origin_lat  || 18.5204,
      origin_lng:     origin_lng  || 73.8567,
      stops:          result.stops,
      optimization_type: optimization_type,
      route_type:        route_type,

      vehicle_id:     result.best_vehicle?.vehicle_id,
      vehicle_number: result.best_vehicle?.registration_number,
      driver_id:      result.best_driver?.driver_id,
      driver_name:    result.best_driver?.name,

      total_distance_km:      result.total_distance_km,
      estimated_duration_min: result.estimated_duration_min,
      optimization_score:     result.optimization_score,
      fuel_cost_estimated:    result.fuel_cost_estimated,
      fuel_cost_optimized:    result.fuel_cost_optimized,
      fuel_saving:            result.fuel_saving,
      co2_emission_kg:        result.co2_emission_kg,

      ai_recommendation: result.ai_recommendation,
      ai_reasoning:      result.ai_reasoning,
      ai_risks:          result.ai_risks,
      delay_risk:        result.delay_risk,
      delay_risk_reason: result.delay_risk_reason,
      weather_summary:   result.weather_summary,
      traffic_summary:   result.traffic_summary,
      weather_alerts:    result.weather_alerts,
      traffic_alerts:    result.traffic_alerts,

      status:     'pending',
      created_by: req.user._id,
    });

    await logAudit({
      company_id: req.user.company_id,
      user:       req.user,
      action:     'route_optimize',
      resource:   'OptimizedRoute',
      resource_id: optimizedRoute._id,
    });

    res.status(201).json({
      success:   true,
      route_id:  optimizedRoute._id,
      result:    { ...result, _id: optimizedRoute._id },
    });
  } catch (err) {
    console.error('Route optimize error:', err);
    res.status(500).json({ error: err.message || 'Optimization failed' });
  }
});

// ─── GET /api/routes/live-map ─────────────────────────────────────────────────
// Dispatcher live map data: all active routes + vehicles
router.get('/live-map', auth, async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const [activeRoutes, activeShipments, availableVehicles, availableDrivers] = await Promise.all([
      OptimizedRoute.find({ company_id: companyId, status: { $in: ['assigned', 'active'] } })
        .populate('vehicle_id', 'registration_number vehicle_type')
        .populate('driver_id',  'name phone')
        .lean(),
      Shipment.find({ company_id: companyId, status: { $in: ['in_transit', 'out_for_delivery', 'at_hub'] } })
        .select('lr_number status destination current_lat current_lng driver_name vehicle_number eta_date')
        .lean(),
      Vehicle.find({ company_id: companyId, status: 'available', is_active: true })
        .select('registration_number vehicle_type capacity_tons status')
        .lean(),
      Driver.find({ company_id: companyId, status: 'available', is_active: true })
        .select('name phone status')
        .lean(),
    ]);

    res.json({
      active_routes:      activeRoutes,
      active_shipments:   activeShipments,
      available_vehicles: availableVehicles,
      available_drivers:  availableDrivers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/routes/history ──────────────────────────────────────────────────
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, vehicle_id, driver_id } = req.query;
    const filter = { company_id: req.user.company_id };
    if (vehicle_id) filter.vehicle_id = vehicle_id;
    if (driver_id)  filter.driver_id  = driver_id;

    const [history, total] = await Promise.all([
      RouteHistory.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('vehicle_id', 'registration_number vehicle_type')
        .populate('driver_id',  'name phone')
        .lean(),
      RouteHistory.countDocuments(filter),
    ]);

    res.json({ history, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/routes/analytics ────────────────────────────────────────────────
router.get('/analytics', auth, async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [routeAgg, fuelAgg, vehicleStats, driverStats] = await Promise.all([
      // Route performance
      OptimizedRoute.aggregate([
        { $match: { company_id: new mongoose.Types.ObjectId(companyId), createdAt: { $gte: since } } },
        { $group: {
          _id:          null,
          total_routes: { $sum: 1 },
          avg_score:    { $avg: '$optimization_score' },
          total_fuel_saving: { $sum: '$fuel_saving' },
          total_co2:         { $sum: '$co2_emission_kg' },
          total_distance:    { $sum: '$total_distance_km' },
          avg_duration:      { $avg: '$estimated_duration_min' },
        }},
      ]),

      // Fuel consumption
      FuelConsumption.aggregate([
        { $match: { company_id: new mongoose.Types.ObjectId(companyId), recorded_at: { $gte: since } } },
        { $group: {
          _id:              null,
          total_fuel:       { $sum: '$fuel_consumed_liters' },
          total_fuel_cost:  { $sum: '$fuel_cost' },
          total_fuel_saving:{ $sum: '$fuel_saving' },
          avg_mileage:      { $avg: '$mileage_kmpl' },
        }},
      ]),

      // Vehicle utilization
      OptimizedRoute.aggregate([
        { $match: { company_id: new mongoose.Types.ObjectId(companyId), vehicle_id: { $exists: true }, createdAt: { $gte: since } } },
        { $group: { _id: '$vehicle_id', trips: { $sum: 1 }, total_km: { $sum: '$total_distance_km' } } },
        { $sort: { trips: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' } },
        { $unwind: { path: '$vehicle', preserveNullAndEmptyArrays: true } },
        { $project: { trips: 1, total_km: 1, registration: '$vehicle.registration_number', type: '$vehicle.vehicle_type' } },
      ]),

      // Driver utilization
      OptimizedRoute.aggregate([
        { $match: { company_id: new mongoose.Types.ObjectId(companyId), driver_id: { $exists: true }, createdAt: { $gte: since } } },
        { $group: { _id: '$driver_id', trips: { $sum: 1 }, total_km: { $sum: '$total_distance_km' } } },
        { $sort: { trips: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'drivers', localField: '_id', foreignField: '_id', as: 'driver' } },
        { $unwind: { path: '$driver', preserveNullAndEmptyArrays: true } },
        { $project: { trips: 1, total_km: 1, name: '$driver.name', phone: '$driver.phone' } },
      ]),
    ]);

    res.json({
      period_days:      Number(days),
      route_summary:    routeAgg[0] || {},
      fuel_summary:     fuelAgg[0] || {},
      vehicle_stats:    vehicleStats,
      driver_stats:     driverStats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/routes/candidates/vehicles ─────────────────────────────────────
router.get('/candidates/vehicles', auth, async (req, res) => {
  try {
    const { weight_tons = 1, origin_lat, origin_lng } = req.query;
    const candidates = await selectBestVehicle(req.user.company_id, {
      total_weight_tons: Number(weight_tons),
      origin_lat:  origin_lat  ? Number(origin_lat)  : undefined,
      origin_lng:  origin_lng  ? Number(origin_lng)  : undefined,
    });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/routes/candidates/drivers ──────────────────────────────────────
router.get('/candidates/drivers', auth, async (req, res) => {
  try {
    const { origin_lat, origin_lng } = req.query;
    const candidates = await selectBestDriver(req.user.company_id, {
      origin_lat: origin_lat ? Number(origin_lat) : undefined,
      origin_lng: origin_lng ? Number(origin_lng) : undefined,
    });
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/routes/learning ────────────────────────────────────────────────
router.get('/learning', auth, async (req, res) => {
  try {
    const insights = await getLearningInsights(req.user.company_id);
    res.json(insights);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/routes/risk ────────────────────────────────────────────────────
router.get('/risk', auth, async (req, res) => {
  try {
    const { route_id, traffic_level = 'moderate', weather_severity = 'low', distance_km = 50, is_night } = req.query;
    const risk = await calculateRouteRisk({
      companyId: req.user.company_id, routeId: route_id,
      trafficLevel: traffic_level, weatherSeverity: weather_severity,
      distanceKm: Number(distance_km), isNightTime: is_night === 'true',
    });
    res.json(risk);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/routes/fatigue ─────────────────────────────────────────────────
router.get('/fatigue', auth, async (req, res) => {
  try {
    const { driver_id } = req.query;
    if (!driver_id) return res.status(400).json({ error: 'driver_id required' });
    const status = await checkDriverFatigue({ companyId: req.user.company_id, driverId: driver_id });
    res.json(status);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/routes/docks ───────────────────────────────────────────────────
router.get('/docks', auth, async (req, res) => {
  try {
    const { warehouse_id, from, to } = req.query;
    const slots = await getDockAvailability({ companyId: req.user.company_id, warehouseId: warehouse_id, fromTime: from, toTime: to });
    res.json({ slots });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/routes/fuel-stations ───────────────────────────────────────────
router.get('/fuel-stations', auth, async (req, res) => {
  try {
    const { lat, lng, radius_km = 15, limit = 5 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });
    const stations = await recommendFuelStations({ companyId: req.user.company_id, lat: Number(lat), lng: Number(lng), radiusKm: Number(radius_km), limit: Number(limit) });
    res.json({ stations });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/routes/:id ──────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const route = await OptimizedRoute.findOne({
      _id:        req.params.id,
      company_id: req.user.company_id,
    })
      .populate('vehicle_id', 'registration_number vehicle_type capacity_tons status')
      .populate('driver_id',  'name phone license_number status')
      .lean();

    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/routes/recalculate ────────────────────────────────────────────
router.post('/recalculate', auth, async (req, res) => {
  try {
    const { route_id, reason } = req.body;
    if (!route_id) return res.status(400).json({ error: 'route_id required' });

    const existing = await OptimizedRoute.findOne({ _id: route_id, company_id: req.user.company_id });
    if (!existing) return res.status(404).json({ error: 'Route not found' });

    // Mark as recalculating
    existing.status = 'recalculating';
    await existing.save();

    const shipmentIds = existing.stops
      .filter(s => s.shipment_id)
      .map(s => s.shipment_id);

    const result = await optimizeRoute({
      companyId:        req.user.company_id,
      shipmentIds,
      originLat:        existing.origin_lat,
      originLng:        existing.origin_lng,
      originAddress:    existing.origin_address,
      optimizationType: existing.optimization_type,
      routeType:        existing.route_type,
      preferredVehicleId: existing.is_manual_override ? existing.vehicle_id : undefined,
      preferredDriverId:  existing.is_manual_override ? existing.driver_id  : undefined,
    });

    // Update the route in place
    Object.assign(existing, {
      stops:                  result.stops,
      total_distance_km:      result.total_distance_km,
      estimated_duration_min: result.estimated_duration_min,
      optimization_score:     result.optimization_score,
      fuel_cost_estimated:    result.fuel_cost_estimated,
      fuel_cost_optimized:    result.fuel_cost_optimized,
      fuel_saving:            result.fuel_saving,
      co2_emission_kg:        result.co2_emission_kg,
      ai_recommendation:      result.ai_recommendation,
      ai_reasoning:           result.ai_reasoning,
      ai_risks:               result.ai_risks,
      delay_risk:             result.delay_risk,
      delay_risk_reason:      result.delay_risk_reason,
      weather_summary:        result.weather_summary,
      traffic_summary:        result.traffic_summary,
      weather_alerts:         result.weather_alerts,
      traffic_alerts:         result.traffic_alerts,
      status:                 'assigned',
    });

    if (!existing.is_manual_override) {
      existing.vehicle_id     = result.best_vehicle?.vehicle_id;
      existing.vehicle_number = result.best_vehicle?.registration_number;
      existing.driver_id      = result.best_driver?.driver_id;
      existing.driver_name    = result.best_driver?.name;
    }

    await existing.save();

    // Notification hook — extend here when Notification model is available

    res.json({ success: true, route: existing, recalculated: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/routes/assign-vehicle ─────────────────────────────────────────
router.post('/assign-vehicle', auth, async (req, res) => {
  try {
    const { route_id, vehicle_id, reason } = req.body;
    if (!route_id || !vehicle_id) return res.status(400).json({ error: 'route_id and vehicle_id required' });

    const [route, vehicle] = await Promise.all([
      OptimizedRoute.findOne({ _id: route_id, company_id: req.user.company_id }),
      Vehicle.findOne({ _id: vehicle_id, company_id: req.user.company_id }),
    ]);

    if (!route)   return res.status(404).json({ error: 'Route not found' });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    route.vehicle_id        = vehicle._id;
    route.vehicle_number    = vehicle.registration_number;
    route.is_manual_override = true;
    route.override_reason   = reason || 'Manual vehicle assignment';
    route.override_by       = req.user._id;
    route.status            = 'assigned';
    await route.save();

    await logAudit({
      company_id: req.user.company_id,
      user:       req.user,
      action:     'assign_vehicle',
      resource:   'OptimizedRoute',
      resource_id: route._id,
    });

    res.json({ success: true, route });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/routes/assign-driver ──────────────────────────────────────────
router.post('/assign-driver', auth, async (req, res) => {
  try {
    const { route_id, driver_id, reason } = req.body;
    if (!route_id || !driver_id) return res.status(400).json({ error: 'route_id and driver_id required' });

    const [route, driver] = await Promise.all([
      OptimizedRoute.findOne({ _id: route_id, company_id: req.user.company_id }),
      Driver.findOne({ _id: driver_id, company_id: req.user.company_id }),
    ]);

    if (!route)  return res.status(404).json({ error: 'Route not found' });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    route.driver_id          = driver._id;
    route.driver_name        = driver.name;
    route.is_manual_override = true;
    route.override_reason    = reason || 'Manual driver assignment';
    route.override_by        = req.user._id;
    route.status             = 'assigned';
    await route.save();

    await logAudit({
      company_id: req.user.company_id,
      user:       req.user,
      action:     'assign_driver',
      resource:   'OptimizedRoute',
      resource_id: route._id,
    });

    res.json({ success: true, route });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/routes/:id/start ───────────────────────────────────────────────
router.post('/:id/start', auth, async (req, res) => {
  try {
    const route = await OptimizedRoute.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!route) return res.status(404).json({ error: 'Route not found' });
    if (!route.vehicle_id || !route.driver_id)
      return res.status(400).json({ error: 'Assign vehicle and driver before starting' });

    route.status     = 'active';
    route.started_at = new Date();
    await route.save();

    // Update vehicle and driver status in parallel
    await Promise.all([
      Vehicle.updateOne({ _id: route.vehicle_id }, { status: 'in_transit' }),
      Driver.updateOne({ _id: route.driver_id },  { status: 'on_trip' }),
    ]);

    res.json({ success: true, route });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/routes/:id/complete ───────────────────────────────────────────
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const { actual_fuel_liters, actual_fuel_cost } = req.body;
    const route = await OptimizedRoute.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!route) return res.status(404).json({ error: 'Route not found' });

    route.status       = 'completed';
    route.completed_at = new Date();
    await route.save();

    const durationMin = route.started_at
      ? Math.round((route.completed_at - route.started_at) / 60000)
      : route.estimated_duration_min;

    // Archive to history
    const lr_numbers = route.stops.map(s => s.lr_number).filter(Boolean);
    const shipmentIds = route.stops.map(s => s.shipment_id).filter(Boolean);

    await RouteHistory.create({
      company_id:         route.company_id,
      optimized_route_id: route._id,
      vehicle_id:         route.vehicle_id,
      driver_id:          route.driver_id,
      vehicle_number:     route.vehicle_number,
      driver_name:        route.driver_name,
      shipment_ids:       shipmentIds,
      lr_numbers,
      total_stops:        route.stops.length,
      total_distance_km:  route.total_distance_km,
      actual_duration_min: durationMin,
      estimated_duration_min: route.estimated_duration_min,
      fuel_cost_estimated:    route.fuel_cost_estimated,
      fuel_cost_actual:       actual_fuel_cost || route.fuel_cost_optimized,
      fuel_saving:            route.fuel_saving,
      co2_emission_kg:        route.co2_emission_kg,
      optimization_score:     route.optimization_score,
      optimization_type:      route.optimization_type,
      on_time:                durationMin <= (route.estimated_duration_min * 1.1),
      delay_minutes:          Math.max(0, durationMin - route.estimated_duration_min),
      started_at:             route.started_at,
      completed_at:           route.completed_at,
      created_by:             req.user._id,
    });

    // Log fuel consumption
    if (actual_fuel_liters) {
      await FuelConsumption.create({
        company_id:           route.company_id,
        optimized_route_id:   route._id,
        vehicle_id:           route.vehicle_id,
        driver_id:            route.driver_id,
        distance_km:          route.total_distance_km,
        fuel_consumed_liters: actual_fuel_liters,
        fuel_cost:            actual_fuel_cost || 0,
        fuel_saving:          route.fuel_saving,
        co2_emission_kg:      route.co2_emission_kg,
        recorded_at:          new Date(),
        created_by:           req.user._id,
      });
    }

    // Release vehicle and driver
    await Promise.all([
      route.vehicle_id ? Vehicle.updateOne({ _id: route.vehicle_id }, { status: 'available' }) : null,
      route.driver_id  ? Driver.updateOne(  { _id: route.driver_id  }, { status: 'available' }) : null,
    ]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// Phase 4 Enterprise Enhancements — Self-Learning, Fatigue, Docks, Fuel, Risk
// (Routes moved before /:id above to avoid Express param capture)
// ════════════════════════════════════════════════════════════════════════════

// ─── POST /api/routes/reoptimize ──────────────────────────────────────────────
// Dynamic re-optimization triggered by traffic/weather/dispatch changes.
// Re-runs core optimizeRoute() and stores result as a new candidate awaiting
// dispatcher approval — does not silently overwrite the active route.
router.post('/reoptimize', auth, async (req, res) => {
  try {
    const { route_id, shipment_ids, origin_lat, origin_lng, origin_address, reason } = req.body;
    if (!shipment_ids?.length) return res.status(400).json({ error: 'shipment_ids required' });

    const result = await optimizeRoute({
      companyId: req.user.company_id, shipmentIds: shipment_ids,
      originLat: origin_lat || 18.5204, originLng: origin_lng || 73.8567,
      originAddress: origin_address || 'Depot', optimizationType: 'ai_recommended', routeType: 'multi_stop',
    });

    // Persist as a new candidate route awaiting dispatcher approval — does not
    // overwrite the original route_id, preserving the existing approval workflow.
    const newRoute = await OptimizedRoute.create({
      company_id: req.user.company_id, branch_id: req.user.branch_id,
      origin_address: origin_address || 'Depot', origin_lat: origin_lat || 18.5204, origin_lng: origin_lng || 73.8567,
      stops: result.stops, optimization_type: 'ai_recommended', route_type: 'multi_stop',
      vehicle_id: result.best_vehicle?.vehicle_id, vehicle_number: result.best_vehicle?.registration_number,
      driver_id: result.best_driver?.driver_id, driver_name: result.best_driver?.name,
      total_distance_km: result.total_distance_km, estimated_duration_min: result.estimated_duration_min,
      optimization_score: result.optimization_score, fuel_cost_estimated: result.fuel_cost_estimated,
      fuel_cost_optimized: result.fuel_cost_optimized, fuel_saving: result.fuel_saving, co2_emission_kg: result.co2_emission_kg,
      ai_recommendation: result.ai_recommendation, ai_reasoning: result.ai_reasoning, ai_risks: result.ai_risks,
      delay_risk: result.delay_risk, delay_risk_reason: result.delay_risk_reason,
      weather_summary: result.weather_summary, traffic_summary: result.traffic_summary,
      weather_alerts: result.weather_alerts, traffic_alerts: result.traffic_alerts,
      status: 'pending', created_by: req.user._id,
    });

    await logAudit({ company_id: req.user.company_id, user: req.user, action: 'route_reoptimized', resource: 'OptimizedRoute', resource_id: newRoute._id });
    res.status(201).json({
      success: true, route_id: newRoute._id, superseded_route_id: route_id || null,
      reason: reason || 'conditions changed', requires_dispatcher_approval: true,
      result: { ...result, _id: newRoute._id },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/docks', auth, async (req, res) => {
  try {
    const { warehouse_id, dock_number, vehicle_id, trip_id, dispatch_plan_id, slot_start, slot_end, purpose } = req.body;
    if (!warehouse_id || !dock_number || !slot_start || !slot_end) return res.status(400).json({ error: 'warehouse_id, dock_number, slot_start, slot_end required' });
    const result = await reserveDockSlot({ companyId: req.user.company_id, warehouseId: warehouse_id, dockNumber: dock_number, vehicleId: vehicle_id, tripId: trip_id, dispatchPlanId: dispatch_plan_id, slotStart: slot_start, slotEnd: slot_end, purpose });
    if (!result.success) return res.status(409).json({ error: 'Dock slot conflict', conflict: result.conflict });
    res.status(201).json(result.booking);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
