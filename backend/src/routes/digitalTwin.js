const express = require('express');
const router  = express.Router();
const { authenticate: auth } = require('../middleware/auth');

const DigitalTwin        = require('../models/DigitalTwin');
const SimulationSnapshot = require('../models/SimulationSnapshot');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

const REPLICA_TYPES = ['fleet','warehouse','shipment','driver','customer','supplier','financial','route'];

// GET /api/digital-twin
router.get('/', auth, async (req, res) => {
  try {
    const twins = await DigitalTwin.find({ company_id: req.user.company_id }).sort({ createdAt: -1 }).lean();
    return ok(res, { twins, total: twins.length });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/digital-twin
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, twin_type, sync_interval_s, tags } = req.body;
    if (!name) return err(res, 'name required');
    const replicas = REPLICA_TYPES.map(t => ({
      entity_type: t, last_synced: new Date(),
      state: { status: 'active', count: Math.floor(Math.random()*50)+1 },
      health: 95 + Math.floor(Math.random()*5), drift_pct: Math.random().toFixed(2)*1,
    }));
    const twin = await DigitalTwin.create({
      company_id: req.user.company_id, name, description,
      twin_type: twin_type || 'enterprise', sync_interval_s: sync_interval_s || 300,
      replicas, status: 'active', health_score: 97,
      total_entities: replicas.length * 10, tags, created_by: req.user._id,
    });
    return ok(res, twin, 'Digital Twin created', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/digital-twin/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!twin) return err(res, 'Not found', 404);
    const snapshots = await SimulationSnapshot.find({ twin_id: twin._id }).sort({ createdAt: -1 }).limit(5).lean();
    return ok(res, { twin, snapshots });
  } catch (e) { return err(res, e.message, 500); }
});

// PUT /api/digital-twin/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const twin = await DigitalTwin.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      req.body, { new: true }
    );
    if (!twin) return err(res, 'Not found', 404);
    return ok(res, twin);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/digital-twin/:id/sync — trigger a sync
router.post('/:id/sync', auth, async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!twin) return err(res, 'Not found', 404);
    setImmediate(async () => {
      const updatedReplicas = twin.replicas.map(r => ({
        ...r.toObject(), last_synced: new Date(),
        health: 95 + Math.floor(Math.random()*5), drift_pct: 0,
      }));
      await DigitalTwin.findByIdAndUpdate(twin._id, {
        replicas: updatedReplicas, last_full_sync: new Date(),
        health_score: 98, data_freshness_s: 0, $inc: { sync_count: 1 },
      });
    });
    return ok(res, { twin_id: twin._id, sync_initiated: true });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/digital-twin/:id/snapshot
router.post('/:id/snapshot', auth, async (req, res) => {
  try {
    const twin = await DigitalTwin.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!twin) return err(res, 'Not found', 404);
    const snap = await SimulationSnapshot.create({
      company_id: req.user.company_id, twin_id: twin._id,
      label: req.body.label || `Snapshot ${new Date().toLocaleString()}`,
      description: req.body.description,
      state: { replicas: twin.replicas, health_score: twin.health_score },
      metrics: {
        fleet_utilization: 78, warehouse_utilization: 65,
        shipments_active: 42, drivers_active: 18,
        cost_per_km: 12.5, co2_per_km: 0.18, on_time_delivery_pct: 93.2,
      },
      is_baseline: req.body.is_baseline || false,
      created_by: req.user._id,
    });
    return ok(res, snap, 'Snapshot saved', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/digital-twin/stats/overview
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [total, active, snapshots] = await Promise.all([
      DigitalTwin.countDocuments({ company_id: cid }),
      DigitalTwin.countDocuments({ company_id: cid, status: 'active' }),
      SimulationSnapshot.countDocuments({ company_id: cid }),
    ]);
    return ok(res, { total_twins: total, active_twins: active, snapshots, platform_health: 97 });
  } catch (e) { return err(res, e.message, 500); }
});

// DELETE /api/digital-twin/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await DigitalTwin.findOneAndDelete({ _id: req.params.id, company_id: req.user.company_id });
    return ok(res, null, 'Digital Twin deleted');
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
