const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const OutboundShipment = require('../models/OutboundShipment');
const Inventory = require('../models/Inventory');
const InventoryMovement = require('../models/InventoryMovement');
const WarehouseBin = require('../models/WarehouseBin');
const WarehouseTask = require('../models/WarehouseTask');
const Dock = require('../models/Dock');

// GET /api/outbound
router.get('/', auth, async (req, res) => {
  try {
    const { warehouse_id, status, page = 1, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id };
    if (warehouse_id) q.warehouse_id = warehouse_id;
    if (status) q.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [shipments, total] = await Promise.all([
      OutboundShipment.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('warehouse_id', 'name').populate('dock_id', 'dock_number').lean(),
      OutboundShipment.countDocuments(q),
    ]);
    const status_counts = await OutboundShipment.aggregate([
      { $match: { company_id: req.user.company_id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    res.json({ shipments, total, page: Number(page), pages: Math.ceil(total / Number(limit)), status_counts: Object.fromEntries(status_counts.map(s => [s._id, s.count])) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/outbound/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const s = await OutboundShipment.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json({ shipment: s });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/outbound — create outbound order
router.post('/', auth, async (req, res) => {
  try {
    const { warehouse_id, customer_name, order_ref, items, planned_dispatch_at, delivery_address } = req.body;
    if (!warehouse_id) return res.status(400).json({ error: 'warehouse_id required' });
    const s = await OutboundShipment.create({
      company_id: req.user.company_id, warehouse_id, customer_name, order_ref,
      planned_dispatch_at, delivery_address,
      items: (items || []).map(i => ({ ...i, sku: (i.sku || '').toUpperCase() })),
      total_skus: (items || []).length,
      total_ordered_qty: (items || []).reduce((t, i) => t + (i.ordered_qty || 0), 0),
    });
    res.status(201).json({ shipment: s, message: 'Outbound order created' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/outbound/:id/allocate — allocate inventory to order items
router.put('/:id/allocate', auth, async (req, res) => {
  try {
    const s = await OutboundShipment.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!s) return res.status(404).json({ error: 'Not found' });
    const allocationResults = [];
    for (const item of s.items) {
      const inv = await Inventory.findOne({ company_id: req.user.company_id, warehouse_id: s.warehouse_id, sku: item.sku, status: 'available' }).sort({ expiry_date: 1 });
      if (inv && inv.available_qty >= item.ordered_qty) {
        inv.reserved_qty += item.ordered_qty;
        await inv.save();
        item.allocated_qty = item.ordered_qty;
        item.bin_id = inv.bin_id;
        item.bin_code = inv.bin_id ? (await WarehouseBin.findById(inv.bin_id).lean())?.bin_code : null;
        allocationResults.push({ sku: item.sku, allocated: item.ordered_qty, bin: item.bin_code });
      } else {
        allocationResults.push({ sku: item.sku, allocated: inv?.available_qty || 0, shortfall: item.ordered_qty - (inv?.available_qty || 0) });
      }
    }
    s.status = 'allocated';
    await s.save();
    res.json({ shipment: s, allocation: allocationResults });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/outbound/:id/generate-picklist — generate picking task
router.put('/:id/generate-picklist', auth, async (req, res) => {
  try {
    const s = await OutboundShipment.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!s) return res.status(404).json({ error: 'Not found' });
    const task = await WarehouseTask.create({
      company_id: req.user.company_id, warehouse_id: s.warehouse_id,
      task_type: 'pick', priority: 'high', outbound_id: s._id,
      reference_number: s.outbound_number,
      items: s.items.map(i => ({ sku: i.sku, product_name: i.product_name, quantity: i.allocated_qty || i.ordered_qty, bin_id: i.bin_id, bin_code: i.bin_code })),
      total_items: s.items.length,
    });
    s.status = 'pick_list_generated';
    s.pick_started_at = new Date();
    await s.save();
    res.json({ shipment: s, task, message: 'Pick list generated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/outbound/:id/pick — record pick quantities
router.put('/:id/pick', auth, async (req, res) => {
  try {
    const { items } = req.body; // [{sku, picked_qty}]
    const s = await OutboundShipment.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!s) return res.status(404).json({ error: 'Not found' });
    for (const p of (items || [])) {
      const item = s.items.find(i => i.sku === p.sku);
      if (item) {
        item.picked_qty = p.picked_qty;
        // Deduct from inventory
        const inv = await Inventory.findOne({ company_id: req.user.company_id, warehouse_id: s.warehouse_id, sku: item.sku });
        if (inv) { inv.quantity -= p.picked_qty; inv.reserved_qty = Math.max(0, inv.reserved_qty - p.picked_qty); await inv.save(); }
        await InventoryMovement.create({
          company_id: req.user.company_id, warehouse_id: s.warehouse_id,
          movement_type: 'pick', sku: item.sku, product_name: item.product_name,
          quantity: p.picked_qty, from_bin_id: item.bin_id, from_bin_code: item.bin_code,
          outbound_id: s._id, performed_by_name: req.user.name || req.user.username,
        });
      }
    }
    s.total_picked_qty = s.items.reduce((t, i) => t + (i.picked_qty || 0), 0);
    s.status = 'packing';
    s.pick_completed_at = new Date();
    s.picked_by_name = req.user.name || req.user.username;
    await s.save();
    res.json({ shipment: s, message: 'Items picked' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/outbound/:id/dispatch — mark dispatched
router.put('/:id/dispatch', auth, async (req, res) => {
  try {
    const { vehicle_number, driver_name, dock_id } = req.body;
    const s = await OutboundShipment.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!s) return res.status(404).json({ error: 'Not found' });
    s.status = 'dispatched';
    s.dispatched_at = new Date();
    s.pack_completed_at = new Date();
    if (vehicle_number) s.vehicle_number = vehicle_number;
    if (driver_name) s.driver_name = driver_name;
    if (dock_id) { s.dock_id = dock_id; const d = await Dock.findById(dock_id); if (d) s.dock_number = d.dock_number; }
    s.manifest_generated = true;
    await s.save();
    if (dock_id) await Dock.findByIdAndUpdate(dock_id, { status: 'available', current_outbound_id: null });
    for (const item of s.items) {
      await InventoryMovement.create({
        company_id: req.user.company_id, warehouse_id: s.warehouse_id,
        movement_type: 'dispatch', sku: item.sku, product_name: item.product_name,
        quantity: item.picked_qty || item.ordered_qty,
        outbound_id: s._id, performed_by_name: req.user.name || req.user.username,
      });
    }
    res.json({ shipment: s, message: 'Shipment dispatched' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/outbound/:id/manifest — generate dispatch manifest
router.get('/:id/manifest', auth, async (req, res) => {
  try {
    const s = await OutboundShipment.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json({
      manifest: {
        manifest_number: `MF-${s.outbound_number}`,
        outbound_number: s.outbound_number,
        customer: s.customer_name,
        delivery_address: s.delivery_address,
        vehicle: s.vehicle_number,
        driver: s.driver_name,
        dispatched_at: s.dispatched_at,
        items: s.items,
        total_weight_kg: s.total_weight_kg,
        total_volume_cbm: s.total_volume_cbm,
        total_value: s.total_value,
        generated_at: new Date(),
      },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
