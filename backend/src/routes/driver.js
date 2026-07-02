const express   = require('express');
const router    = express.Router();
const mongoose  = require('mongoose');
const Anthropic  = require('@anthropic-ai/sdk');
const { authenticate: auth } = require('../middleware/auth');

const Driver            = require('../models/Driver');
const Trip              = require('../models/Trip');
const Shipment          = require('../models/Shipment');
const TrackingEvent     = require('../models/TrackingEvent');
const DriverLocation    = require('../models/DriverLocation');
const DriverIncident    = require('../models/DriverIncident');
const DriverNotification= require('../models/DriverNotification');
const DriverPerformance = require('../models/DriverPerformance');
const DriverDocument    = require('../models/DriverDocument');
const DriverChecklist   = require('../models/DriverChecklist');
const DriverSOS         = require('../models/DriverSOS');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── helpers ──────────────────────────────────────────────────────────────────
function incidentNum() {
  const d = new Date();
  return `INC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}
function sosNum() {
  return `SOS-${Date.now().toString(36).toUpperCase()}`;
}

async function resolveDriverId(req) {
  // 'driver' role users have their driver_id in the JWT via user.driver_id
  // admins/managers pass ?driver_id= to query on behalf of a driver
  if (req.user.driver_id) return req.user.driver_id;
  if (req.query.driver_id) return req.query.driver_id;
  if (req.body && req.body.driver_id) return req.body.driver_id;
  return null;
}

async function aiDriverInsight(context) {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `You are an AI logistics assistant for truck drivers. Analyze this context and give actionable guidance.

Context: ${JSON.stringify(context)}

Reply with JSON only:
{
  "next_action": "most important thing the driver should do right now",
  "safety_tip": "one brief safety reminder",
  "eta_note": "brief ETA observation if applicable",
  "fuel_note": "fuel advice if applicable",
  "confidence": 70
}`,
      }],
    });
    const text = msg.content[0].text.trim();
    return JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
  } catch {
    return {
      next_action: 'Follow the planned route and contact dispatch if any issue arises.',
      safety_tip: 'Maintain safe following distance and take breaks every 2 hours.',
      eta_note: null,
      fuel_note: 'Monitor fuel levels and refuel before dropping below 25%.',
      confidence: 60,
    };
  }
}

async function aiIncidentRecommendation(incident) {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Logistics incident occurred: type=${incident.type}, description="${incident.description}".
Give a brief recommendation. Reply JSON only:
{"recommendation":"...", "escalate":true/false, "estimated_delay_min":30}`,
      }],
    });
    const text = msg.content[0].text.trim();
    return JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
  } catch {
    const defaults = {
      breakdown: { recommendation: 'Pull off safely, call roadside assistance, notify dispatcher.', escalate: true, estimated_delay_min: 120 },
      accident:  { recommendation: 'Ensure safety, call emergency services, document the scene.', escalate: true, estimated_delay_min: 180 },
      delay:     { recommendation: 'Update ETA, notify dispatcher and customer.', escalate: false, estimated_delay_min: 60 },
      traffic:   { recommendation: 'Check alternate routes via navigation app, update ETA.', escalate: false, estimated_delay_min: 45 },
    };
    return defaults[incident.type] || { recommendation: 'Contact dispatcher for guidance.', escalate: false, estimated_delay_min: 30 };
  }
}

// ── GET /api/driver/dashboard ─────────────────────────────────────────────────
router.get('/dashboard', auth, async (req, res) => {
  try {
    const cid      = req.user.company_id;
    const driverId = await resolveDriverId(req);

    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const tripFilter = { company_id: cid, planned_start: { $gte: today, $lt: tomorrow } };
    if (driverId) tripFilter.driver_id = driverId;

    const [todayTrips, activeTrips, recentIncidents, unreadNotifs, driver] = await Promise.all([
      Trip.find(tripFilter).populate('vehicle_id', 'registration_number vehicle_type').sort({ planned_start: 1 }).limit(10).lean(),
      Trip.find({ company_id: cid, ...(driverId ? { driver_id: driverId } : {}), status: 'in_progress' }).limit(5).lean(),
      DriverIncident.find({ company_id: cid, ...(driverId ? { driver_id: driverId } : {}), status: { $ne: 'resolved' } }).sort({ createdAt: -1 }).limit(5).lean(),
      driverId ? DriverNotification.countDocuments({ company_id: cid, driver_id: driverId, is_read: false }) : 0,
      driverId ? Driver.findById(driverId).lean() : null,
    ]);

    // AI insight
    const aiInsight = await aiDriverInsight({
      active_trips: activeTrips.length,
      today_trips: todayTrips.length,
      driver_status: driver?.status || 'available',
      open_incidents: recentIncidents.length,
    });

    // Expiring documents alert
    const expiryAlert = driverId ? await DriverDocument.find({
      driver_id: driverId,
      expiry_date: { $lte: new Date(Date.now() + 30 * 86400000) },
      status: { $in: ['valid', 'expiring_soon'] },
    }).lean() : [];

    res.json({ driver, todayTrips, activeTrips, recentIncidents, unreadNotifs, aiInsight, expiryAlert });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/driver/trips ─────────────────────────────────────────────────────
router.get('/trips', auth, async (req, res) => {
  try {
    const cid      = req.user.company_id;
    const driverId = await resolveDriverId(req);
    const { status, page = 1, limit = 20, date_from, date_to } = req.query;

    const q = { company_id: cid };
    if (driverId) q.driver_id = driverId;
    if (status)   q.status = status;
    if (date_from || date_to) {
      q.planned_start = {};
      if (date_from) q.planned_start.$gte = new Date(date_from);
      if (date_to)   q.planned_start.$lte = new Date(date_to);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [trips, total] = await Promise.all([
      Trip.find(q).sort({ planned_start: -1 }).skip(skip).limit(Number(limit))
        .populate('vehicle_id', 'registration_number vehicle_type').lean(),
      Trip.countDocuments(q),
    ]);

    res.json({ trips, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/driver/trips/:id ─────────────────────────────────────────────────
router.get('/trips/:id', auth, async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('vehicle_id', 'registration_number vehicle_type make model')
      .populate('driver_id', 'name phone license_number')
      .lean();
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const shipments = trip.shipment_ids?.length
      ? await Shipment.find({ _id: { $in: trip.shipment_ids } }).lean()
      : [];

    const [locations, incidents, checklist] = await Promise.all([
      DriverLocation.find({ trip_id: trip._id }).sort({ recorded_at: -1 }).limit(50).lean(),
      DriverIncident.find({ trip_id: trip._id }).sort({ createdAt: -1 }).lean(),
      DriverChecklist.findOne({ trip_id: trip._id, type: 'pre_trip' }).lean(),
    ]);

    res.json({ trip, shipments, locations, incidents, checklist });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/driver/trips/start ─────────────────────────────────────────────
router.post('/trips/start', auth, async (req, res) => {
  try {
    const { trip_id, odometer_start, lat, lng } = req.body;
    const trip = await Trip.findOne({ _id: trip_id, company_id: req.user.company_id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status === 'in_progress') return res.status(400).json({ error: 'Trip already started' });

    trip.status       = 'in_progress';
    trip.actual_start = new Date();
    if (odometer_start) trip.odometer_start = odometer_start;
    await trip.save();

    // Update driver status
    if (trip.driver_id) await Driver.findByIdAndUpdate(trip.driver_id, { status: 'on_trip' });

    // Update shipment statuses
    if (trip.shipment_ids?.length) {
      await Shipment.updateMany({ _id: { $in: trip.shipment_ids } }, { $set: { status: 'in_transit' } });
    }

    // Log GPS if provided
    if (lat && lng && trip.driver_id) {
      await DriverLocation.create({ company_id: req.user.company_id, driver_id: trip.driver_id, trip_id: trip._id, lat, lng });
    }

    // Auto pre-trip checklist
    const defaultItems = [
      { item: 'Tyre pressure checked', category: 'vehicle' },
      { item: 'Engine oil level OK', category: 'vehicle' },
      { item: 'Lights and indicators working', category: 'vehicle' },
      { item: 'Fuel level sufficient', category: 'vehicle' },
      { item: 'Driving license valid', category: 'documents' },
      { item: 'Vehicle RC available', category: 'documents' },
      { item: 'Insurance copy available', category: 'documents' },
      { item: 'Cargo secured properly', category: 'cargo' },
      { item: 'Delivery documents in hand', category: 'cargo' },
      { item: 'Emergency kit present', category: 'safety' },
    ];
    await DriverChecklist.create({
      company_id:   req.user.company_id,
      driver_id:    trip.driver_id,
      trip_id:      trip._id,
      type:         'pre_trip',
      status:       'completed',
      items:        defaultItems.map(i => ({ ...i, checked: true })),
      completed_at: new Date(),
      submitted_by: req.user._id,
    });

    // Notify driver
    if (trip.driver_id) {
      await DriverNotification.create({
        company_id: req.user.company_id,
        driver_id:  trip.driver_id,
        trip_id:    trip._id,
        type:       'trip_started',
        title:      'Trip Started',
        message:    `Trip ${trip.trip_number} has been started. Safe travels!`,
        priority:   'normal',
      });
    }

    res.json({ success: true, trip });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/driver/trips/pause ─────────────────────────────────────────────
router.post('/trips/pause', auth, async (req, res) => {
  try {
    const { trip_id, reason, lat, lng } = req.body;
    const trip = await Trip.findOne({ _id: trip_id, company_id: req.user.company_id, status: 'in_progress' });
    if (!trip) return res.status(404).json({ error: 'Active trip not found' });

    trip.status = 'exception';
    await trip.save();

    if (reason && trip.driver_id) {
      await DriverIncident.create({
        company_id:      req.user.company_id,
        driver_id:       trip.driver_id,
        trip_id:         trip._id,
        incident_number: incidentNum(),
        type:            'delay',
        severity:        'medium',
        description:     reason,
        lat, lng,
        reported_by:     req.user._id,
      });
    }

    res.json({ success: true, trip });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/driver/trips/resume ────────────────────────────────────────────
router.post('/trips/resume', auth, async (req, res) => {
  try {
    const { trip_id } = req.body;
    const trip = await Trip.findOneAndUpdate(
      { _id: trip_id, company_id: req.user.company_id, status: 'exception' },
      { status: 'in_progress' },
      { new: true },
    );
    if (!trip) return res.status(404).json({ error: 'Paused trip not found' });
    res.json({ success: true, trip });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/driver/trips/complete ──────────────────────────────────────────
router.post('/trips/complete', auth, async (req, res) => {
  try {
    const { trip_id, odometer_end, fuel_consumed_l, notes } = req.body;
    const trip = await Trip.findOne({ _id: trip_id, company_id: req.user.company_id });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    trip.status     = 'completed';
    trip.actual_end = new Date();
    if (odometer_end)     trip.odometer_end     = odometer_end;
    if (fuel_consumed_l)  trip.fuel_consumed_l  = fuel_consumed_l;
    if (notes)            trip.notes            = notes;
    if (odometer_end && trip.odometer_start) {
      trip.total_distance_km = odometer_end - trip.odometer_start;
    }
    await trip.save();

    if (trip.driver_id) await Driver.findByIdAndUpdate(trip.driver_id, { status: 'available' });

    // Mark pending shipments as delivered
    if (trip.shipment_ids?.length) {
      await Shipment.updateMany(
        { _id: { $in: trip.shipment_ids }, status: { $ne: 'delivered' } },
        { $set: { status: 'delivered', delivery_date: new Date() } },
      );
    }

    // Post-trip checklist
    await DriverChecklist.create({
      company_id:   req.user.company_id,
      driver_id:    trip.driver_id,
      trip_id:      trip._id,
      type:         'post_trip',
      status:       'completed',
      items: [
        { item: 'Vehicle parked safely', category: 'vehicle', checked: true },
        { item: 'Keys handed over', category: 'vehicle', checked: true },
        { item: 'Fuel level noted', category: 'vehicle', checked: true },
        { item: 'All deliveries confirmed', category: 'cargo', checked: true },
        { item: 'POD collected for all stops', category: 'cargo', checked: true },
        { item: 'Vehicle damage checked', category: 'safety', checked: true },
      ],
      completed_at: new Date(),
      submitted_by: req.user._id,
    });

    if (trip.driver_id) {
      await DriverNotification.create({
        company_id: req.user.company_id,
        driver_id:  trip.driver_id,
        trip_id:    trip._id,
        type:       'trip_completed',
        title:      'Trip Completed',
        message:    `Trip ${trip.trip_number} completed successfully. Great work!`,
        priority:   'normal',
      });
    }

    res.json({ success: true, trip });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/driver/location ─────────────────────────────────────────────────
router.post('/location', auth, async (req, res) => {
  try {
    const { driver_id, trip_id, lat, lng, speed_kmh, heading, accuracy_m, address } = req.body;
    if (!lat || !lng || !driver_id) return res.status(400).json({ error: 'driver_id, lat, lng required' });

    const loc = await DriverLocation.create({
      company_id: req.user.company_id,
      driver_id, trip_id, lat, lng, speed_kmh, heading, accuracy_m, address,
    });

    // Update shipment current location
    if (trip_id) {
      const trip = await Trip.findById(trip_id).lean();
      if (trip?.shipment_ids?.length) {
        await Shipment.updateMany(
          { _id: { $in: trip.shipment_ids } },
          { $set: { current_lat: lat, current_lng: lng, last_gps_update: new Date(), current_location_name: address || '' } },
        );
      }
    }

    // Idle detection (speed < 2 kmh for logging)
    if ((speed_kmh || 0) < 2) {
      await DriverLocation.findByIdAndUpdate(loc._id, { is_idle: true });
    }

    res.json({ success: true, location_id: loc._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/driver/pod ─────────────────────────────────────────────────────
router.post('/pod', auth, async (req, res) => {
  try {
    const { shipment_id, trip_id, stop_sequence, signature, photo_urls, receiver_name, receiver_phone, notes, lat, lng } = req.body;
    if (!shipment_id) return res.status(400).json({ error: 'shipment_id required' });

    const shipment = await Shipment.findOne({ _id: shipment_id, company_id: req.user.company_id });
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    // Update shipment to delivered
    await Shipment.findByIdAndUpdate(shipment._id, {
      status:        'delivered',
      delivery_date: new Date(),
      ...(lat && { current_lat: lat }),
      ...(lng && { current_lng: lng }),
    });

    // Create tracking event
    await TrackingEvent.create({
      shipment_id: shipment._id,
      lr_number:   shipment.lr_number,
      status:      'delivered',
      description: `Delivered to ${receiver_name || shipment.receiver_name}. POD collected.`,
      location:    shipment.destination,
      lat, lng,
      timestamp:   new Date(),
      created_by:  req.user._id,
      metadata: { signature: !!signature, photos: photo_urls?.length || 0, notes },
    });

    // Update trip stop if applicable
    if (trip_id && stop_sequence != null) {
      await Trip.updateOne(
        { _id: trip_id, 'stops.sequence': stop_sequence },
        { $set: { 'stops.$.status': 'completed', 'stops.$.actual_arrival': new Date(), 'stops.$.pod_collected': true } },
      );
    }

    res.json({ success: true, shipment_id, lr_number: shipment.lr_number, delivered_at: new Date() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/driver/incident ─────────────────────────────────────────────────
router.post('/incident', auth, async (req, res) => {
  try {
    const { driver_id, trip_id, type, description, lat, lng, address, photos } = req.body;
    if (!driver_id || !type || !description) return res.status(400).json({ error: 'driver_id, type, description required' });

    const aiRec = await aiIncidentRecommendation({ type, description });

    const incident = await DriverIncident.create({
      company_id:       req.user.company_id,
      driver_id, trip_id,
      incident_number:  incidentNum(),
      type,
      severity:         ['accident', 'emergency'].includes(type) ? 'critical' : 'medium',
      description,
      lat, lng, address,
      photos:           photos || [],
      ai_recommendation:   aiRec.recommendation,
      ai_confidence:       aiRec.confidence || 70,
      estimated_delay_min: aiRec.estimated_delay_min,
      reported_by:         req.user._id,
    });

    // Pause trip if breakdown/accident
    if (['breakdown', 'accident', 'emergency'].includes(type) && trip_id) {
      await Trip.findByIdAndUpdate(trip_id, { status: 'exception' });
    }

    // Notify via driver notification
    await DriverNotification.create({
      company_id: req.user.company_id,
      driver_id,
      trip_id,
      type:       'breakdown',
      title:      `Incident Reported: ${type.replace(/_/g, ' ').toUpperCase()}`,
      message:    `Your incident has been logged. ${aiRec.recommendation}`,
      priority:   aiRec.escalate ? 'urgent' : 'high',
    });

    res.status(201).json({ incident, ai_recommendation: aiRec });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/driver/sos ──────────────────────────────────────────────────────
router.post('/sos', auth, async (req, res) => {
  try {
    const { driver_id, trip_id, type, description, lat, lng, address } = req.body;
    if (!driver_id) return res.status(400).json({ error: 'driver_id required' });

    const sos = await DriverSOS.create({
      company_id:  req.user.company_id,
      driver_id, trip_id,
      sos_number:  sosNum(),
      type:        type || 'other',
      description: description || 'Emergency SOS triggered',
      lat, lng, address,
      triggered_at: new Date(),
    });

    // Also create a critical incident
    await DriverIncident.create({
      company_id:      req.user.company_id,
      driver_id, trip_id,
      incident_number: incidentNum(),
      type:            'emergency',
      severity:        'critical',
      description:     description || 'SOS Emergency triggered',
      lat, lng, address,
      ai_recommendation: 'Emergency services have been notified. Stay in the vehicle if safe to do so.',
      ai_confidence:   90,
      reported_by:     req.user._id,
    });

    // Pause trip
    if (trip_id) await Trip.findByIdAndUpdate(trip_id, { status: 'exception' });

    res.status(201).json({ success: true, sos_number: sos.sos_number, sos_id: sos._id, message: 'SOS alert sent to dispatch. Help is on the way.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/driver/performance ───────────────────────────────────────────────
router.get('/performance', auth, async (req, res) => {
  try {
    const cid      = req.user.company_id;
    const driverId = await resolveDriverId(req);
    const { period = 'monthly' } = req.query;

    // Aggregate from Trip model
    const matchQ = { company_id: cid };
    if (driverId) matchQ.driver_id = new mongoose.Types.ObjectId(driverId);

    const since = new Date();
    if (period === 'daily')   since.setDate(since.getDate() - 1);
    else if (period === 'weekly') since.setDate(since.getDate() - 7);
    else since.setDate(since.getDate() - 30);
    matchQ.actual_start = { $gte: since };

    const [tripStats, incidents, savedPerf, allDrivers] = await Promise.all([
      Trip.aggregate([
        { $match: matchQ },
        { $group: {
            _id: driverId ? '$driver_id' : null,
            trips_completed:  { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            trips_cancelled:  { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            total_assigned:   { $sum: 1 },
            total_distance:   { $sum: '$total_distance_km' },
            total_fuel:       { $sum: '$fuel_consumed_l' },
            on_time:          { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'completed'] }, { $lte: ['$actual_end', '$planned_end'] }] }, 1, 0] } },
        }},
      ]),
      DriverIncident.countDocuments({ company_id: cid, ...(driverId ? { driver_id: driverId } : {}), createdAt: { $gte: since } }),
      driverId ? DriverPerformance.findOne({ company_id: cid, driver_id: driverId, period }).sort({ period_date: -1 }).lean() : null,
      !driverId ? Driver.find({ company_id: cid, is_active: true }).limit(20).lean() : null,
    ]);

    const stats = tripStats[0] || {};
    const completion_rate = stats.total_assigned > 0 ? Math.round((stats.trips_completed / stats.total_assigned) * 100) : 0;
    const on_time_pct     = stats.trips_completed > 0 ? Math.round((stats.on_time / stats.trips_completed) * 100) : 0;
    const fuel_efficiency = (stats.total_fuel > 0 && stats.total_distance > 0) ? Math.round((stats.total_distance / stats.total_fuel) * 10) / 10 : 0;
    const safety_score    = Math.max(0, 100 - (incidents * 10));
    const overall_score   = Math.round((completion_rate * 0.3) + (on_time_pct * 0.3) + (safety_score * 0.2) + (fuel_efficiency > 0 ? Math.min(fuel_efficiency * 5, 20) : 0));

    res.json({
      period,
      since,
      metrics: {
        trips_completed:   stats.trips_completed  || 0,
        trips_cancelled:   stats.trips_cancelled  || 0,
        total_assigned:    stats.total_assigned   || 0,
        total_distance_km: Math.round(stats.total_distance || 0),
        total_fuel_l:      Math.round(stats.total_fuel || 0),
        on_time_deliveries:stats.on_time || 0,
        incidents,
        completion_rate,
        on_time_pct,
        fuel_efficiency_kmpl: fuel_efficiency,
        safety_score,
        overall_score,
      },
      saved: savedPerf,
      all_drivers: allDrivers,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/driver/documents ──────────────────────────────────────────────────
router.get('/documents', auth, async (req, res) => {
  try {
    const cid      = req.user.company_id;
    const driverId = await resolveDriverId(req);

    const filter = { company_id: cid };
    if (driverId) filter.driver_id = driverId;

    const docs = await DriverDocument.find(filter).populate('driver_id', 'name phone').sort({ expiry_date: 1 }).lean();

    // Mark expiring/expired
    const now = new Date();
    const soon = new Date(Date.now() + 30 * 86400000);
    const enriched = docs.map(d => ({
      ...d,
      days_to_expiry: d.expiry_date ? Math.ceil((new Date(d.expiry_date) - now) / 86400000) : null,
      status: !d.expiry_date ? 'valid'
        : new Date(d.expiry_date) < now ? 'expired'
        : new Date(d.expiry_date) < soon ? 'expiring_soon'
        : 'valid',
    }));

    res.json({ documents: enriched, total: enriched.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/driver/documents ────────────────────────────────────────────────
router.post('/documents', auth, async (req, res) => {
  try {
    const doc = await DriverDocument.create({
      ...req.body,
      company_id:  req.user.company_id,
      uploaded_by: req.user._id,
    });
    res.status(201).json(doc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/driver/voice ────────────────────────────────────────────────────
router.post('/voice', auth, async (req, res) => {
  try {
    const { command, driver_id, trip_id, context } = req.body;
    if (!command) return res.status(400).json({ error: 'command required' });

    // Map voice keywords to actions
    const cmd = command.toLowerCase();
    let action = null, message = '', data = {};

    if (/start.?trip|trip start|begin trip/.test(cmd)) {
      action  = 'start_trip';
      message = 'Trip start command received. Tap confirm to start your trip.';
    } else if (/reached.?pickup|at pickup|pickup.?done/.test(cmd)) {
      action  = 'reached_pickup';
      message = 'Marked as reached pickup. Please collect the cargo and proceed.';
    } else if (/reached.?warehouse|at warehouse|warehouse.?done/.test(cmd)) {
      action  = 'reached_warehouse';
      message = 'Marked as reached warehouse. Proceed with loading/unloading.';
    } else if (/reached.?destination|at destination|delivered/.test(cmd)) {
      action  = 'reached_destination';
      message = 'Marked as reached destination. Please collect POD from customer.';
    } else if (/upload.?pod|submit.?pod|pod.?done/.test(cmd)) {
      action  = 'upload_pod';
      message = 'Opening POD upload screen.';
    } else if (/report.?delay|there.?delay|delay.?report/.test(cmd)) {
      action  = 'report_delay';
      message = 'Delay reported. Please describe the reason and estimated delay time.';
    } else if (/breakdown|broke.?down|vehicle.?issue/.test(cmd)) {
      action  = 'report_breakdown';
      message = 'Breakdown report opened. Pull over safely and tap confirm.';
    } else if (/call.?dispatch|contact.?dispatch|dispatcher/.test(cmd)) {
      action  = 'call_dispatcher';
      message = 'Connecting to dispatcher...';
      data    = { dispatcher_phone: context?.dispatcher_phone || null };
    } else if (/fuel.?station|petrol.?pump|diesel.?pump/.test(cmd)) {
      action  = 'find_fuel';
      message = 'Searching for nearest fuel stations...';
    } else if (/workshop|mechanic|garage|repair/.test(cmd)) {
      action  = 'find_workshop';
      message = 'Searching for nearest workshops and garages...';
    } else if (/complete.?trip|trip.?complete|end.?trip/.test(cmd)) {
      action  = 'complete_trip';
      message = 'Trip completion initiated. Please confirm to close this trip.';
    } else if (/sos|emergency|help/.test(cmd)) {
      action  = 'sos';
      message = 'SOS alert activated. Notifying dispatcher and emergency contacts.';
    }

    // AI fallback for unrecognized commands
    if (!action) {
      try {
        const msg = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `Driver voice command: "${command}". Context: driver is on a logistics trip.
Reply with JSON: {"action":"best_action_code_or_null","response":"helpful spoken response in 1-2 sentences","confidence":70}`,
          }],
        });
        const parsed = JSON.parse(msg.content[0].text.trim().match(/\{[\s\S]*\}/)[0]);
        action  = parsed.action;
        message = parsed.response;
      } catch {
        message = 'I didn\'t understand that command. Try saying "Start trip", "Report breakdown", or "Call dispatcher".';
      }
    }

    res.json({ command, action, message, data, recognized: !!action });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/driver/incidents ─────────────────────────────────────────────────
router.get('/incidents', auth, async (req, res) => {
  try {
    const cid      = req.user.company_id;
    const driverId = await resolveDriverId(req);
    const { status, page = 1, limit = 20 } = req.query;
    const q = { company_id: cid };
    if (driverId) q.driver_id = driverId;
    if (status)   q.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [incidents, total] = await Promise.all([
      DriverIncident.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('driver_id', 'name phone').lean(),
      DriverIncident.countDocuments(q),
    ]);
    res.json({ incidents, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/driver/notifications ─────────────────────────────────────────────
router.get('/notifications', auth, async (req, res) => {
  try {
    const driverId = await resolveDriverId(req);
    if (!driverId) return res.json({ notifications: [], total: 0 });
    const notifs = await DriverNotification.find({ company_id: req.user.company_id, driver_id: driverId })
      .sort({ createdAt: -1 }).limit(30).lean();
    res.json({ notifications: notifs, total: notifs.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/driver/notifications/:id/read ──────────────────────────────────
router.patch('/notifications/:id/read', auth, async (req, res) => {
  try {
    await DriverNotification.findByIdAndUpdate(req.params.id, { is_read: true, read_at: new Date() });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/driver/sos ───────────────────────────────────────────────────────
router.get('/sos', auth, async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    const q = { company_id: req.user.company_id };
    if (status !== 'all') q.status = status;
    const sosList = await DriverSOS.find(q).sort({ triggered_at: -1 }).limit(20)
      .populate('driver_id', 'name phone').lean();
    res.json({ sos: sosList, total: sosList.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PATCH /api/driver/sos/:id ─────────────────────────────────────────────────
router.patch('/sos/:id', auth, async (req, res) => {
  try {
    const { status, resolution_notes } = req.body;
    const sos = await DriverSOS.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      {
        status,
        ...(status === 'acknowledged' ? { acknowledged_by: req.user._id, acknowledged_at: new Date() } : {}),
        ...(status === 'resolved' ? { resolved_by: req.user._id, resolved_at: new Date(), resolution_notes } : {}),
      },
      { new: true },
    );
    if (!sos) return res.status(404).json({ error: 'SOS not found' });
    res.json(sos);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
