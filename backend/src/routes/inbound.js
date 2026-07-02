const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const InboundShipment = require('../models/InboundShipment');
const Inventory = require('../models/Inventory');
const InventoryMovement = require('../models/InventoryMovement');
const WarehouseBin = require('../models/WarehouseBin');
const Dock = require('../models/Dock');
const WarehouseTask = require('../models/WarehouseTask');

// GET /api/inbound — list inbound shipments
router.get('/', auth, async (req, res) => {
  try {
    const { warehouse_id, status, page = 1, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id };
    if (warehouse_id) q.warehouse_id = warehouse_id;
    if (status) q.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [shipments, total] = await Promise.all([
      InboundShipment.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('warehouse_id', 'name').populate('dock_id', 'dock_number').lean(),
      InboundShipment.countDocuments(q),
    ]);
    const status_counts = await InboundShipment.aggregate([
      { $match: { company_id: req.user.company_id, ...(warehouse_id ? { warehouse_id: require('mongoose').Types.ObjectId.createFromHexString(warehouse_id) } : {}) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    res.json({ shipments, total, page: Number(page), pages: Math.ceil(total / Number(limit)), status_counts: Object.fromEntries(status_counts.map(s => [s._id, s.count])) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/inbound/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const s = await InboundShipment.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('warehouse_id', 'name').populate('dock_id', 'dock_number dock_type').lean();
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json({ shipment: s });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/inbound — create inbound shipment
router.post('/', auth, async (req, res) => {
  try {
    const { warehouse_id, supplier_name, vehicle_number, driver_name, expected_arrival, items, shipment_ref, po_number, dock_id } = req.body;
    if (!warehouse_id) return res.status(400).json({ error: 'warehouse_id required' });
    const s = await InboundShipment.create({
      company_id: req.user.company_id, warehouse_id, supplier_name, vehicle_number, driver_name,
      expected_arrival, shipment_ref, po_number, dock_id,
      items: (items || []).map(i => ({ ...i, sku: (i.sku || '').toUpperCase() })),
      total_skus: (items || []).length,
      total_expected_qty: (items || []).reduce((s, i) => s + (i.expected_qty || 0), 0),
    });
    res.status(201).json({ shipment: s, message: 'Inbound shipment created' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/inbound/:id/arrive — mark vehicle arrived, assign dock
router.put('/:id/arrive', auth, async (req, res) => {
  try {
    const { dock_id } = req.body;
    const s = await InboundShipment.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!s) return res.status(404).json({ error: 'Not found' });
    s.status = 'arrived';
    s.actual_arrival = new Date();
    if (dock_id) {
      s.dock_id = dock_id;
      const dock = await Dock.findById(dock_id);
      if (dock) { s.dock_number = dock.dock_number; await Dock.findByIdAndUpdate(dock_id, { status: 'occupied', current_inbound_id: s._id, occupied_since: new Date() }); }
    }
    await s.save();
    res.json({ shipment: s, message: 'Vehicle arrived' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/inbound/:id/receive — record received quantities per item
router.put('/:id/receive', auth, async (req, res) => {
  try {
    const { items } = req.body; // [{sku, received_qty, damaged_qty, quality_status, bin_code, bin_id}]
    const s = await InboundShipment.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!s) return res.status(404).json({ error: 'Not found' });
    if (!s.receiving_started_at) s.receiving_started_at = new Date();
    s.status = 'receiving';
    for (const upd of (items || [])) {
      const item = s.items.find(i => i.sku === (upd.sku || '').toUpperCase());
      if (item) {
        item.received_qty = upd.received_qty || item.received_qty;
        item.damaged_qty = upd.damaged_qty || item.damaged_qty || 0;
        item.quality_status = upd.quality_status || item.quality_status;
        if (upd.bin_id) { item.bin_id = upd.bin_id; item.bin_code = upd.bin_code; }
        item.barcode_scanned = upd.barcode_scanned || false;
      }
    }
    s.total_received_qty = s.items.reduce((t, i) => t + (i.received_qty || 0), 0);
    s.total_damaged_qty = s.items.reduce((t, i) => t + (i.damaged_qty || 0), 0);
    s.received_by_name = req.user.name || req.user.username;
    await s.save();
    res.json({ shipment: s, message: 'Receiving updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/inbound/:id/complete — finalize put-away, create inventory records
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const s = await InboundShipment.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!s) return res.status(404).json({ error: 'Not found' });

    // Create / update inventory for each received item
    for (const item of s.items) {
      if (!item.received_qty || item.received_qty <= 0) continue;
      const goodQty = item.received_qty - (item.damaged_qty || 0) - (item.rejected_qty || 0);
      if (goodQty > 0) {
        const existing = await Inventory.findOne({ company_id: req.user.company_id, warehouse_id: s.warehouse_id, sku: item.sku, bin_id: item.bin_id || null });
        if (existing) { existing.quantity += goodQty; await existing.save(); }
        else {
          await Inventory.create({
            company_id: req.user.company_id, warehouse_id: s.warehouse_id,
            sku: item.sku, product_name: item.product_name || item.sku,
            quantity: goodQty, uom: item.uom || 'pcs', bin_id: item.bin_id,
            batch_number: item.batch_number, lot_number: item.lot_number, expiry_date: item.expiry_date,
            unit_cost: item.unit_cost || 0, inbound_id: s._id,
            supplier_name: s.supplier_name, received_at: new Date(),
          });
        }
        // Update bin
        if (item.bin_id) await WarehouseBin.findByIdAndUpdate(item.bin_id, { status: 'occupied', sku: item.sku, quantity: goodQty, last_movement_at: new Date() });

        await InventoryMovement.create({
          company_id: req.user.company_id, warehouse_id: s.warehouse_id,
          movement_type: 'put_away', sku: item.sku, product_name: item.product_name || item.sku,
          quantity: goodQty, to_bin_id: item.bin_id, to_bin_code: item.bin_code,
          inbound_id: s._id, performed_by_name: req.user.name || req.user.username,
        });
      }
    }

    s.status = 'completed';
    s.put_away_completed_at = new Date();
    s.receiving_completed_at = new Date();
    await s.save();

    // Free dock
    if (s.dock_id) await Dock.findByIdAndUpdate(s.dock_id, { status: 'available', current_inbound_id: null, occupied_since: null });

    res.json({ shipment: s, message: 'Inbound completed — inventory updated' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/inbound/:id/status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const s = await InboundShipment.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { status: req.body.status } }, { new: true }
    );
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json({ shipment: s });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
