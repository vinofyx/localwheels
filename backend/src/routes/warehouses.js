const express   = require('express');
const router    = express.Router();
const Warehouse = require('../models/Warehouse');
const WarehouseZone = require('../models/WarehouseZone');
const WarehouseRack = require('../models/WarehouseRack');
const WarehouseBin  = require('../models/WarehouseBin');
const WarehouseWorker = require('../models/WarehouseWorker');
const { authenticate, requireRole } = require('../middleware/auth');
const audit = require('../utils/audit');

const ok  = (res, data, message = 'Success', status = 200) => res.status(status).json({ status: true, message, data });
const err = (res, message, status = 400) => res.status(status).json({ status: false, message, errors: [message] });

router.use(authenticate);

// GET /api/warehouses
router.get('/', async (req, res) => {
  try {
    const { branch_id } = req.query;
    const q = { company_id: req.user.company_id, is_active: true };
    if (branch_id) q.branch_id = branch_id;
    const warehouses = await Warehouse.find(q)
      .populate('branch_id', 'branch_name city').sort({ name: 1 }).lean();
    ok(res, { warehouses, total: warehouses.length });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/warehouses/:id
router.get('/:id', async (req, res) => {
  try {
    const w = await Warehouse.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('branch_id', 'branch_name city').lean();
    if (!w) return err(res, 'Warehouse not found', 404);
    ok(res, w);
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/warehouses
router.post('/', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { name, branch_id, address, city, state, pincode, capacity_sqft, manager_name, manager_phone } = req.body;
    if (!name) return err(res, 'name is required');
    const w = await Warehouse.create({ company_id: req.user.company_id, name, branch_id, address, city, state, pincode, capacity_sqft, manager_name, manager_phone });
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'CREATE', resource: 'Warehouse', resource_id: w._id, resource_ref: name, req });
    ok(res, w, 'Warehouse created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/warehouses/:id
router.put('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const w = await Warehouse.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: req.body }, { new: true, runValidators: true }
    );
    if (!w) return err(res, 'Warehouse not found', 404);
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'UPDATE', resource: 'Warehouse', resource_id: w._id, resource_ref: w.name, changes: req.body, req });
    ok(res, w, 'Warehouse updated');
  } catch (e) { err(res, e.message, 500); }
});

// DELETE /api/warehouses/:id
router.delete('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const w = await Warehouse.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { is_active: false } }, { new: true }
    );
    if (!w) return err(res, 'Warehouse not found', 404);
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'DELETE', resource: 'Warehouse', resource_id: w._id, resource_ref: w.name, req });
    ok(res, null, 'Warehouse deleted');
  } catch (e) { err(res, e.message, 500); }
});

// ── ZONES ───────────────────────────────────────────────────────────────────

// GET /api/warehouses/:wid/zones
router.get('/:wid/zones', authenticate, async (req, res) => {
  try {
    const zones = await WarehouseZone.find({ warehouse_id: req.params.wid, company_id: req.user.company_id, is_active: true }).sort({ zone_code: 1 }).lean();
    ok(res, { zones, total: zones.length });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/warehouses/:wid/zones
router.post('/:wid/zones', authenticate, async (req, res) => {
  try {
    const { zone_code, zone_name, zone_type, area_sqm, temperature_min, temperature_max, max_weight_tons } = req.body;
    if (!zone_code || !zone_name) return err(res, 'zone_code and zone_name required');
    const zone = await WarehouseZone.create({ company_id: req.user.company_id, warehouse_id: req.params.wid, zone_code, zone_name, zone_type, area_sqm, temperature_min, temperature_max, max_weight_tons });
    ok(res, zone, 'Zone created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/warehouses/:wid/zones/:id
router.put('/:wid/zones/:id', authenticate, async (req, res) => {
  try {
    const zone = await WarehouseZone.findOneAndUpdate({ _id: req.params.id, warehouse_id: req.params.wid, company_id: req.user.company_id }, { $set: req.body }, { new: true });
    if (!zone) return err(res, 'Zone not found', 404);
    ok(res, zone);
  } catch (e) { err(res, e.message, 500); }
});

// ── RACKS ────────────────────────────────────────────────────────────────────

// GET /api/warehouses/:wid/racks
router.get('/:wid/racks', authenticate, async (req, res) => {
  try {
    const { zone_id } = req.query;
    const q = { warehouse_id: req.params.wid, company_id: req.user.company_id, is_active: true };
    if (zone_id) q.zone_id = zone_id;
    const racks = await WarehouseRack.find(q).populate('zone_id', 'zone_code zone_name').sort({ rack_code: 1 }).lean();
    ok(res, { racks, total: racks.length });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/warehouses/:wid/racks
router.post('/:wid/racks', authenticate, async (req, res) => {
  try {
    const { zone_id, rack_code, rack_name, rack_type, total_shelves, max_weight_kg, height_m, width_m, depth_m } = req.body;
    if (!zone_id || !rack_code) return err(res, 'zone_id and rack_code required');
    const rack = await WarehouseRack.create({ company_id: req.user.company_id, warehouse_id: req.params.wid, zone_id, rack_code, rack_name, rack_type, total_shelves, max_weight_kg, height_m, width_m, depth_m });
    ok(res, rack, 'Rack created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// ── BINS ─────────────────────────────────────────────────────────────────────

// GET /api/warehouses/:wid/bins
router.get('/:wid/bins', authenticate, async (req, res) => {
  try {
    const { zone_id, rack_id, status, page = 1, limit = 50 } = req.query;
    const q = { warehouse_id: req.params.wid, company_id: req.user.company_id, is_active: true };
    if (zone_id) q.zone_id = zone_id;
    if (rack_id) q.rack_id = rack_id;
    if (status) q.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [bins, total] = await Promise.all([
      WarehouseBin.find(q).populate('zone_id', 'zone_code').populate('rack_id', 'rack_code').sort({ bin_code: 1 }).skip(skip).limit(Number(limit)).lean(),
      WarehouseBin.countDocuments(q),
    ]);
    const empty = await WarehouseBin.countDocuments({ ...q, status: 'empty' });
    ok(res, { bins, total, empty, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/warehouses/:wid/bins
router.post('/:wid/bins', authenticate, async (req, res) => {
  try {
    const { zone_id, rack_id, bin_code, aisle, shelf_level, max_weight_kg, max_volume_cbm } = req.body;
    if (!zone_id || !rack_id || !bin_code) return err(res, 'zone_id, rack_id, bin_code required');
    const bin = await WarehouseBin.create({ company_id: req.user.company_id, warehouse_id: req.params.wid, zone_id, rack_id, bin_code, aisle, shelf_level, max_weight_kg, max_volume_cbm });
    // Update rack bin counts
    await WarehouseRack.findByIdAndUpdate(rack_id, { $inc: { total_bins: 1, available_bins: 1 } });
    await WarehouseZone.findByIdAndUpdate(zone_id, { $inc: { total_bins: 1, available_bins: 1 } });
    ok(res, bin, 'Bin created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/warehouses/:wid/bins/bulk — bulk create bins for a rack
router.post('/:wid/bins/bulk', authenticate, async (req, res) => {
  try {
    const { zone_id, rack_id, shelves, bins_per_shelf, max_weight_kg, max_volume_cbm } = req.body;
    if (!zone_id || !rack_id) return err(res, 'zone_id and rack_id required');
    // Auto-resolve rack_code from the DB so caller doesn't need to pass it
    let rack_code = req.body.rack_code;
    if (!rack_code) {
      const rackDoc = await WarehouseRack.findById(rack_id).lean();
      rack_code = rackDoc?.rack_code;
      if (!rack_code) return err(res, 'rack not found');
    }
    const numShelves = Number(shelves) || 3;
    const binsPerShelf = Number(bins_per_shelf) || 4;
    const shelfLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
    const created = [];
    for (let s = 0; s < numShelves; s++) {
      for (let b = 1; b <= binsPerShelf; b++) {
        const bin_code = `${rack_code}-${shelfLabels[s] || s + 1}-${String(b).padStart(2, '0')}`;
        try {
          const bin = await WarehouseBin.create({ company_id: req.user.company_id, warehouse_id: req.params.wid, zone_id, rack_id, bin_code, shelf_level: shelfLabels[s] || String(s + 1), max_weight_kg: max_weight_kg || 500, max_volume_cbm: max_volume_cbm || 1 });
          created.push(bin);
        } catch { /* skip duplicates */ }
      }
    }
    await WarehouseRack.findByIdAndUpdate(rack_id, { total_bins: created.length, available_bins: created.length });
    await WarehouseZone.findByIdAndUpdate(zone_id, { $inc: { total_bins: created.length, available_bins: created.length } });
    ok(res, { bins: created, count: created.length }, `${created.length} bins created`, 201);
  } catch (e) { err(res, e.message, 500); }
});

// ── WORKERS ─────────────────────────────────────────────────────────────────

// GET /api/warehouses/:wid/workers
router.get('/:wid/workers', authenticate, async (req, res) => {
  try {
    const workers = await WarehouseWorker.find({ warehouse_id: req.params.wid, company_id: req.user.company_id, is_active: true }).sort({ name: 1 }).lean();
    ok(res, { workers, total: workers.length });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/warehouses/:wid/workers
router.post('/:wid/workers', authenticate, async (req, res) => {
  try {
    const { name, employee_id, role, shift, phone } = req.body;
    if (!name || !role) return err(res, 'name and role required');
    const worker = await WarehouseWorker.create({ company_id: req.user.company_id, warehouse_id: req.params.wid, name, employee_id, role, shift, phone });
    ok(res, worker, 'Worker added', 201);
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
