const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const crypto = require('crypto');
const Inventory = require('../models/Inventory');
const WarehouseBin = require('../models/WarehouseBin');
const InboundShipment = require('../models/InboundShipment');
const OutboundShipment = require('../models/OutboundShipment');

// Generate a deterministic barcode from data
function generateBarcode(data) {
  return crypto.createHash('md5').update(String(data)).digest('hex').substring(0, 12).toUpperCase();
}

// Generate QR data (structured JSON string encoded as base64)
function generateQRData(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

// POST /api/barcode/generate — generate barcode/QR for inventory item or bin
router.post('/generate', auth, async (req, res) => {
  try {
    const { type, reference_id, data } = req.body;
    // type: inventory | bin | inbound | outbound | sku
    let barcode, qr_data, label_data;

    if (type === 'inventory') {
      const inv = await Inventory.findOne({ _id: reference_id, company_id: req.user.company_id }).lean();
      if (!inv) return res.status(404).json({ error: 'Inventory not found' });
      barcode = generateBarcode(`INV-${inv._id}`);
      qr_data = generateQRData({ type: 'inventory', id: inv._id, sku: inv.sku, product: inv.product_name, batch: inv.batch_number, qty: inv.quantity });
      label_data = { barcode, qr_data, sku: inv.sku, product_name: inv.product_name, batch: inv.batch_number, qty: inv.quantity, bin: inv.bin_id };
      await Inventory.findByIdAndUpdate(reference_id, { barcode, qr_code: qr_data });
    } else if (type === 'bin') {
      const bin = await WarehouseBin.findOne({ _id: reference_id, company_id: req.user.company_id }).lean();
      if (!bin) return res.status(404).json({ error: 'Bin not found' });
      barcode = generateBarcode(`BIN-${bin.bin_code}-${bin._id}`);
      qr_data = generateQRData({ type: 'bin', id: bin._id, bin_code: bin.bin_code });
      label_data = { barcode, qr_data, bin_code: bin.bin_code };
      await WarehouseBin.findByIdAndUpdate(reference_id, { barcode, qr_code: qr_data });
    } else if (type === 'sku') {
      const { sku, product_name } = data || {};
      barcode = generateBarcode(`SKU-${(sku || '').toUpperCase()}`);
      qr_data = generateQRData({ type: 'sku', sku: (sku || '').toUpperCase(), product_name });
      label_data = { barcode, qr_data, sku: (sku || '').toUpperCase(), product_name };
    } else {
      barcode = generateBarcode(`${type}-${reference_id || Date.now()}`);
      qr_data = generateQRData({ type, reference_id, ...(data || {}) });
      label_data = { barcode, qr_data, ...data };
    }

    res.json({ barcode, qr_data, label_data, type });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/barcode/scan — look up what a barcode belongs to
router.post('/scan', auth, async (req, res) => {
  try {
    const { barcode, qr_data } = req.body;
    if (!barcode && !qr_data) return res.status(400).json({ error: 'barcode or qr_data required' });

    // Decode QR if provided
    if (qr_data) {
      try {
        const decoded = JSON.parse(Buffer.from(qr_data, 'base64').toString('utf8'));
        return res.json({ type: decoded.type, decoded, scanned_at: new Date() });
      } catch { /* fallback to barcode lookup */ }
    }

    // Barcode lookup — check inventory, then bins
    const inv = await Inventory.findOne({ barcode, company_id: req.user.company_id }).lean();
    if (inv) return res.json({ type: 'inventory', inventory: inv, scanned_at: new Date() });

    const bin = await WarehouseBin.findOne({ barcode, company_id: req.user.company_id }).lean();
    if (bin) return res.json({ type: 'bin', bin, scanned_at: new Date() });

    const inbound = await InboundShipment.findOne({ 'items.barcode_scanned': true, company_id: req.user.company_id }).lean();

    res.status(404).json({ error: 'Barcode not found', barcode });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/barcode/bulk-generate — generate barcodes for all bins in a warehouse
router.post('/bulk-generate', auth, async (req, res) => {
  try {
    const { warehouse_id, target } = req.body; // target: bins | inventory
    if (!warehouse_id) return res.status(400).json({ error: 'warehouse_id required' });

    let updated = 0;
    if (target === 'bins' || !target) {
      const bins = await WarehouseBin.find({ warehouse_id, company_id: req.user.company_id, barcode: null }).lean();
      for (const bin of bins) {
        const bc = generateBarcode(`BIN-${bin.bin_code}-${bin._id}`);
        const qr = generateQRData({ type: 'bin', id: bin._id, bin_code: bin.bin_code });
        await WarehouseBin.findByIdAndUpdate(bin._id, { barcode: bc, qr_code: qr });
        updated++;
      }
    }
    if (target === 'inventory') {
      const items = await Inventory.find({ warehouse_id, company_id: req.user.company_id, barcode: null }).lean();
      for (const inv of items) {
        const bc = generateBarcode(`INV-${inv._id}`);
        const qr = generateQRData({ type: 'inventory', id: inv._id, sku: inv.sku });
        await Inventory.findByIdAndUpdate(inv._id, { barcode: bc, qr_code: qr });
        updated++;
      }
    }
    res.json({ message: `Generated barcodes for ${updated} ${target || 'bins'}`, updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/barcode/lookup/:code — quick lookup
router.get('/lookup/:code', auth, async (req, res) => {
  try {
    const code = req.params.code;
    const inv = await Inventory.findOne({ $or: [{ barcode: code }, { sku: code.toUpperCase() }], company_id: req.user.company_id }).lean();
    if (inv) return res.json({ found: true, type: 'inventory', data: inv });
    const bin = await WarehouseBin.findOne({ $or: [{ barcode: code }, { bin_code: code.toUpperCase() }], company_id: req.user.company_id }).lean();
    if (bin) return res.json({ found: true, type: 'bin', data: bin });
    res.json({ found: false, code });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
