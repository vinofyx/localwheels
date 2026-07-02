const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const InventoryMovement = require('../models/InventoryMovement');
const WarehouseBin = require('../models/WarehouseBin');

// GET /api/inventory — list with filters
router.get('/', auth, async (req, res) => {
  try {
    const { warehouse_id, sku, status, bin_id, page = 1, limit = 50, search, expiring_days } = req.query;
    const q = { company_id: req.user.company_id };
    if (warehouse_id) q.warehouse_id = warehouse_id;
    if (sku) q.sku = sku.toUpperCase();
    if (status) q.status = status;
    if (bin_id) q.bin_id = bin_id;
    if (search) q.$or = [
      { sku: { $regex: search, $options: 'i' } },
      { product_name: { $regex: search, $options: 'i' } },
      { batch_number: { $regex: search, $options: 'i' } },
    ];
    if (expiring_days) {
      const cutoff = new Date(Date.now() + Number(expiring_days) * 86400000);
      q.expiry_date = { $lte: cutoff, $gt: new Date() };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
      Inventory.find(q).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit))
        .populate('warehouse_id', 'name').populate('bin_id', 'bin_code').lean(),
      Inventory.countDocuments(q),
    ]);
    // Summary stats
    const stats = await Inventory.aggregate([
      { $match: { ...q } },
      { $group: { _id: null, total_skus: { $sum: 1 }, total_qty: { $sum: '$quantity' }, total_value: { $sum: '$total_value' }, reserved: { $sum: '$reserved_qty' } } },
    ]);
    res.json({ records, total, page: Number(page), pages: Math.ceil(total / Number(limit)), stats: stats[0] || {} });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/inventory/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const inv = await Inventory.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('warehouse_id', 'name').populate('bin_id', 'bin_code').lean();
    if (!inv) return res.status(404).json({ error: 'Not found' });
    const movements = await InventoryMovement.find({ company_id: req.user.company_id, sku: inv.sku, warehouse_id: inv.warehouse_id }).sort({ performed_at: -1 }).limit(10).lean();
    res.json({ inventory: inv, movements });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/inventory — create stock record (usually via inbound)
router.post('/', auth, async (req, res) => {
  try {
    const { warehouse_id, sku, product_name, quantity, bin_id, batch_number, lot_number, expiry_date, unit_cost, uom, weight_per_unit_kg, volume_per_unit_cbm, category, supplier_name } = req.body;
    if (!warehouse_id || !sku || !product_name) return res.status(400).json({ error: 'warehouse_id, sku, product_name required' });

    // Upsert — add to existing same SKU+bin
    const existing = await Inventory.findOne({ company_id: req.user.company_id, warehouse_id, sku: sku.toUpperCase(), bin_id: bin_id || null, batch_number: batch_number || null });
    let inv;
    if (existing) {
      existing.quantity += Number(quantity) || 0;
      await existing.save();
      inv = existing;
    } else {
      inv = await Inventory.create({ company_id: req.user.company_id, warehouse_id, sku: sku.toUpperCase(), product_name, quantity: Number(quantity) || 0, bin_id, batch_number, lot_number, expiry_date, unit_cost, uom, weight_per_unit_kg, volume_per_unit_cbm, category, supplier_name });
    }

    // Log movement
    await InventoryMovement.create({
      company_id: req.user.company_id, warehouse_id, movement_type: 'receive',
      sku: sku.toUpperCase(), product_name, quantity: Number(quantity) || 0,
      to_bin_id: bin_id, performed_by_name: req.user.name || req.user.username,
    });

    res.status(201).json({ inventory: inv });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/inventory/:id/adjust — stock adjustment
router.put('/:id/adjust', auth, async (req, res) => {
  try {
    const { qty_change, reason, notes } = req.body;
    const inv = await Inventory.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!inv) return res.status(404).json({ error: 'Not found' });
    const prev = inv.quantity;
    inv.quantity = Math.max(0, inv.quantity + Number(qty_change));
    await inv.save();
    await InventoryMovement.create({
      company_id: req.user.company_id, warehouse_id: inv.warehouse_id,
      movement_type: 'adjustment', sku: inv.sku, product_name: inv.product_name,
      quantity: Number(qty_change), notes: notes || reason,
      performed_by_name: req.user.name || req.user.username,
    });
    res.json({ inventory: inv, previous_qty: prev, new_qty: inv.quantity });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/inventory/:id/transfer — move bin
router.put('/:id/transfer', auth, async (req, res) => {
  try {
    const { to_bin_id, quantity } = req.body;
    const inv = await Inventory.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!inv) return res.status(404).json({ error: 'Not found' });
    const qty = Number(quantity) || inv.quantity;
    const fromBin = inv.bin_id;
    const fromBinCode = inv.bin_id ? (await WarehouseBin.findById(inv.bin_id).lean())?.bin_code : null;
    const toBin = await WarehouseBin.findOne({ _id: to_bin_id, company_id: req.user.company_id });
    if (!toBin) return res.status(404).json({ error: 'Target bin not found' });

    inv.bin_id = to_bin_id;
    inv.quantity = Math.max(0, inv.quantity - qty);
    await inv.save();

    // Update bin statuses
    if (fromBin) await WarehouseBin.findByIdAndUpdate(fromBin, { status: inv.quantity === 0 ? 'empty' : 'occupied', quantity: inv.quantity });
    await WarehouseBin.findByIdAndUpdate(to_bin_id, { status: 'occupied', sku: inv.sku, quantity: toBin.quantity + qty, inventory_id: inv._id, last_movement_at: new Date() });

    await InventoryMovement.create({
      company_id: req.user.company_id, warehouse_id: inv.warehouse_id,
      movement_type: 'transfer', sku: inv.sku, product_name: inv.product_name,
      quantity: qty, from_bin_id: fromBin, from_bin_code: fromBinCode,
      to_bin_id, to_bin_code: toBin.bin_code,
      performed_by_name: req.user.name || req.user.username,
    });
    res.json({ message: 'Transfer complete', inventory: inv });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/inventory/cycle-count — cycle count reconciliation
router.post('/cycle-count', auth, async (req, res) => {
  try {
    const { warehouse_id, counts } = req.body; // counts: [{inventory_id, physical_qty}]
    if (!warehouse_id || !Array.isArray(counts)) return res.status(400).json({ error: 'warehouse_id and counts[] required' });
    const results = [];
    for (const c of counts) {
      const inv = await Inventory.findOne({ _id: c.inventory_id, company_id: req.user.company_id });
      if (!inv) continue;
      const variance = Number(c.physical_qty) - inv.quantity;
      const prev = inv.quantity;
      inv.quantity = Number(c.physical_qty);
      inv.count_variance = variance;
      inv.last_count_date = new Date();
      await inv.save();
      if (variance !== 0) {
        await InventoryMovement.create({
          company_id: req.user.company_id, warehouse_id,
          movement_type: 'cycle_count', sku: inv.sku, product_name: inv.product_name,
          quantity: variance, notes: `Cycle count: expected ${prev}, found ${c.physical_qty}`,
          performed_by_name: req.user.name || req.user.username,
        });
      }
      results.push({ sku: inv.sku, previous: prev, counted: Number(c.physical_qty), variance });
    }
    res.json({ message: 'Cycle count recorded', results });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/inventory/movements/recent
router.get('/movements/recent', auth, async (req, res) => {
  try {
    const { warehouse_id, limit = 50 } = req.query;
    const q = { company_id: req.user.company_id };
    if (warehouse_id) q.warehouse_id = warehouse_id;
    const movements = await InventoryMovement.find(q).sort({ performed_at: -1 }).limit(Number(limit)).lean();
    res.json({ movements, count: movements.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/inventory/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const inv = await Inventory.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { status: 'blocked', quantity: 0 } }, { new: true }
    );
    if (!inv) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Inventory record deactivated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
