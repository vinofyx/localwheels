const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const WarehouseBin = require('../models/WarehouseBin');
const InventoryMovement = require('../models/InventoryMovement');

// RFID-ready architecture — simulates RFID reader events
// In production, RFID readers POST to /api/rfid/read with tag data

// GET /api/rfid/readers — list configured RFID readers
router.get('/readers', auth, async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    // Static reader config (production: stored in DB)
    const readers = [
      { reader_id: 'READER-01', location: 'Dock A - Inbound', zone: 'staging', status: 'online', last_read: new Date() },
      { reader_id: 'READER-02', location: 'Dock B - Outbound', zone: 'dispatch', status: 'online', last_read: new Date() },
      { reader_id: 'READER-03', location: 'Zone 1 - Aisle 1', zone: 'dry', status: 'online', last_read: null },
      { reader_id: 'READER-04', location: 'Zone 2 - Cold Storage', zone: 'cold', status: 'offline', last_read: null },
    ];
    res.json({ readers, total: readers.length, online: readers.filter(r => r.status === 'online').length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/rfid/read — RFID tag read event (from reader or simulator)
router.post('/read', auth, async (req, res) => {
  try {
    const { rfid_tag, reader_id, warehouse_id, event_type } = req.body;
    // event_type: arrival | departure | movement | count
    if (!rfid_tag) return res.status(400).json({ error: 'rfid_tag required' });

    // Lookup by rfid_tag (stored on inventory item in a real impl)
    const inv = await Inventory.findOne({
      company_id: req.user.company_id,
      $or: [{ barcode: rfid_tag }, { serial_number: rfid_tag }],
    }).lean();

    if (inv && warehouse_id) {
      await InventoryMovement.create({
        company_id: req.user.company_id, warehouse_id,
        movement_type: event_type === 'departure' ? 'dispatch' : 'receive',
        sku: inv.sku, product_name: inv.product_name, quantity: 1,
        scan_method: 'rfid', scanned: true,
        notes: `RFID read by ${reader_id}`,
        performed_by_name: 'RFID System',
      });
    }

    res.json({
      rfid_tag, reader_id, event_type: event_type || 'read',
      inventory_found: !!inv,
      inventory: inv || null,
      read_at: new Date(),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/rfid/inventory-count — RFID bulk inventory count
router.post('/inventory-count', auth, async (req, res) => {
  try {
    const { warehouse_id, rfid_tags } = req.body; // rfid_tags: [{tag, zone}]
    if (!warehouse_id || !Array.isArray(rfid_tags)) return res.status(400).json({ error: 'warehouse_id and rfid_tags[] required' });

    const results = { found: 0, not_found: 0, items: [] };
    for (const { tag, zone } of rfid_tags) {
      const inv = await Inventory.findOne({
        company_id: req.user.company_id, warehouse_id,
        $or: [{ barcode: tag }, { serial_number: tag }],
      }).lean();
      if (inv) {
        results.found++;
        results.items.push({ tag, sku: inv.sku, product_name: inv.product_name, qty: inv.quantity, status: 'located' });
      } else {
        results.not_found++;
        results.items.push({ tag, status: 'unknown_tag' });
      }
    }
    res.json({ ...results, warehouse_id, scanned_at: new Date() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/rfid/simulate — simulate RFID read for testing
router.post('/simulate', auth, async (req, res) => {
  try {
    const { warehouse_id, sku, event_type } = req.body;
    const inv = await Inventory.findOne({ company_id: req.user.company_id, warehouse_id, sku: (sku || '').toUpperCase() }).lean();
    const simTag = `RFID-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    res.json({
      simulated: true, rfid_tag: simTag, event_type: event_type || 'read',
      inventory_found: !!inv, inventory: inv,
      reader_id: 'SIM-READER-01', read_at: new Date(),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
