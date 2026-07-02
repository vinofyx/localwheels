const express = require('express');
const multer  = require('multer');
const bcrypt  = require('bcryptjs');
const { authenticate, requireRole } = require('../middleware/auth');
const Customer   = require('../models/Customer');
const Vehicle    = require('../models/Vehicle');
const Driver     = require('../models/Driver');
const Inventory  = require('../models/Inventory');
const ChartOfAccount = require('../models/ChartOfAccount');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Minimal CSV parser (handles quoted fields) ─────────────────────────────────
function parseCSV(buffer) {
  const text = buffer.toString('utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  function parseLine(line) {
    const fields = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { fields.push(cur.trim()); cur = ''; }
      else { cur += c; }
    }
    fields.push(cur.trim());
    return fields;
  }

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
  return lines.slice(1).map(line => {
    const vals = parseLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || '').trim(); });
    return row;
  }).filter(r => Object.values(r).some(v => v));
}

// ── CSV Template definitions ──────────────────────────────────────────────────
const TEMPLATES = {
  customers: 'name,phone,email,address,city,state,gstin,credit_limit,payment_terms_days\n' +
             'Example Customer,9999000001,customer@email.com,123 Main St,Mumbai,Maharashtra,27ABCDE1234F1Z5,50000,30',

  vehicles:  'registration_number,vehicle_type,make,model,year,capacity_tons,fuel_type,owner_name\n' +
             'MH01AB1234,Mini Truck,Tata,Ace,2020,1.5,diesel,Owner Name',

  drivers:   'name,phone,license_number,license_expiry,address,city,state\n' +
             'Driver Name,9999000002,MH0120230012345,2026-12-31,456 Lane,Mumbai,Maharashtra',

  inventory: 'product_name,sku,category,uom,unit_cost,quantity,bin_location\n' +
             'Product Name,SKU001,Electronics,PCS,500,100,A-1-1',

  chart_of_accounts: 'account_code,account_name,account_type,level,is_leaf,opening_balance\n' +
                     '1001,New Account,asset,2,true,0',

  opening_balance: 'account_code,opening_balance\n1100,50000\n1300,25000',
};

// GET /api/import/template/:entity — download CSV template
router.get('/template/:entity', authenticate, (req, res) => {
  const tpl = TEMPLATES[req.params.entity];
  if (!tpl) return res.status(404).json({ error: 'Template not found' });
  res.set('Content-Type', 'text/csv');
  res.set('Content-Disposition', `attachment; filename="${req.params.entity}_template.csv"`);
  res.send(tpl);
});

// POST /api/import/customers
router.post('/customers', authenticate, requireRole('admin', 'manager'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });
    if (!req.user.company_id) return res.status(400).json({ error: 'No company context' });

    const rows = parseCSV(req.file.buffer);
    const results = { total: rows.length, inserted: 0, skipped: 0, errors: [] };

    for (const [i, row] of rows.entries()) {
      try {
        if (!row.name) { results.errors.push({ row: i + 2, error: 'name required' }); results.skipped++; continue; }
        const exists = await Customer.findOne({ company_id: req.user.company_id, phone: row.phone });
        if (exists) { results.skipped++; continue; }
        await Customer.create({
          company_id: req.user.company_id,
          name:              row.name,
          phone:             row.phone || '',
          email:             row.email || '',
          address:           row.address || '',
          city:              row.city || '',
          state:             row.state || '',
          gstin:             row.gstin || '',
          credit_limit:      parseFloat(row.credit_limit) || 0,
          payment_terms_days: parseInt(row.payment_terms_days) || 30,
          is_active:         true,
        });
        results.inserted++;
      } catch (e) {
        results.errors.push({ row: i + 2, error: e.message });
        results.skipped++;
      }
    }
    res.json({ message: 'Customer import complete', ...results });
  } catch (err) { next(err); }
});

// POST /api/import/vehicles
router.post('/vehicles', authenticate, requireRole('admin', 'manager'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });
    if (!req.user.company_id) return res.status(400).json({ error: 'No company context' });

    const rows = parseCSV(req.file.buffer);
    const results = { total: rows.length, inserted: 0, skipped: 0, errors: [] };

    for (const [i, row] of rows.entries()) {
      try {
        if (!row.registration_number) { results.errors.push({ row: i + 2, error: 'registration_number required' }); results.skipped++; continue; }
        const exists = await Vehicle.findOne({ registration_number: row.registration_number.toUpperCase() });
        if (exists) { results.skipped++; continue; }
        await Vehicle.create({
          company_id:           req.user.company_id,
          registration_number:  row.registration_number.toUpperCase(),
          vehicle_type:         row.vehicle_type || 'Mini Truck',
          make:                 row.make || '',
          model:                row.model || '',
          year:                 parseInt(row.year) || new Date().getFullYear(),
          capacity_tons:        parseFloat(row.capacity_tons) || 1,
          fuel_type:            row.fuel_type || 'diesel',
          owner_name:           row.owner_name || '',
          status:               'available',
        });
        results.inserted++;
      } catch (e) {
        results.errors.push({ row: i + 2, error: e.message });
        results.skipped++;
      }
    }
    res.json({ message: 'Vehicle import complete', ...results });
  } catch (err) { next(err); }
});

// POST /api/import/drivers
router.post('/drivers', authenticate, requireRole('admin', 'manager'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });
    if (!req.user.company_id) return res.status(400).json({ error: 'No company context' });

    const rows = parseCSV(req.file.buffer);
    const results = { total: rows.length, inserted: 0, skipped: 0, errors: [] };

    for (const [i, row] of rows.entries()) {
      try {
        if (!row.name || !row.phone) { results.errors.push({ row: i + 2, error: 'name and phone required' }); results.skipped++; continue; }
        const exists = await Driver.findOne({ company_id: req.user.company_id, phone: row.phone });
        if (exists) { results.skipped++; continue; }
        await Driver.create({
          company_id:      req.user.company_id,
          name:            row.name,
          phone:           row.phone,
          license_number:  row.license_number || '',
          license_expiry:  row.license_expiry ? new Date(row.license_expiry) : null,
          address:         row.address || '',
          city:            row.city || '',
          state:           row.state || '',
          status:          'available',
        });
        results.inserted++;
      } catch (e) {
        results.errors.push({ row: i + 2, error: e.message });
        results.skipped++;
      }
    }
    res.json({ message: 'Driver import complete', ...results });
  } catch (err) { next(err); }
});

// POST /api/import/inventory
router.post('/inventory', authenticate, requireRole('admin', 'manager'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });
    const { branch_id } = req.body;
    if (!branch_id) return res.status(400).json({ error: 'branch_id required' });

    const rows = parseCSV(req.file.buffer);
    const results = { total: rows.length, inserted: 0, skipped: 0, errors: [] };

    for (const [i, row] of rows.entries()) {
      try {
        if (!row.product_name) { results.errors.push({ row: i + 2, error: 'product_name required' }); results.skipped++; continue; }
        await Inventory.create({
          company_id:   req.user.company_id,
          branch_id,
          product_name: row.product_name,
          sku:          row.sku || '',
          category:     row.category || 'General',
          uom:          row.uom || 'PCS',
          unit_cost:    parseFloat(row.unit_cost) || 0,
          quantity:     parseInt(row.quantity) || 0,
          bin_location: row.bin_location || '',
          status:       'available',
        });
        results.inserted++;
      } catch (e) {
        results.errors.push({ row: i + 2, error: e.message });
        results.skipped++;
      }
    }
    res.json({ message: 'Inventory import complete', ...results });
  } catch (err) { next(err); }
});

// POST /api/import/chart-of-accounts
router.post('/chart-of-accounts', authenticate, requireRole('admin'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });
    if (!req.user.company_id) return res.status(400).json({ error: 'No company context' });

    const rows = parseCSV(req.file.buffer);
    const results = { total: rows.length, inserted: 0, skipped: 0, errors: [] };
    const fy = new Date().getFullYear();
    const fyLabel = `${fy}-${String(fy + 1).slice(2)}`;

    for (const [i, row] of rows.entries()) {
      try {
        if (!row.account_code || !row.account_name) { results.errors.push({ row: i + 2, error: 'account_code and account_name required' }); results.skipped++; continue; }
        const exists = await ChartOfAccount.findOne({ company_id: req.user.company_id, account_code: row.account_code });
        if (exists) { results.skipped++; continue; }
        await ChartOfAccount.create({
          company_id:      req.user.company_id,
          account_code:    row.account_code,
          account_name:    row.account_name,
          account_type:    row.account_type || 'asset',
          level:           parseInt(row.level) || 2,
          is_leaf:         row.is_leaf === 'true' || row.is_leaf === '1',
          opening_balance: parseFloat(row.opening_balance) || 0,
          current_balance: parseFloat(row.opening_balance) || 0,
          currency:        'INR',
          tags:            [],
          financial_year:  fyLabel,
        });
        results.inserted++;
      } catch (e) {
        results.errors.push({ row: i + 2, error: e.message });
        results.skipped++;
      }
    }
    res.json({ message: 'Chart of Accounts import complete', ...results });
  } catch (err) { next(err); }
});

// POST /api/import/opening-balance — update opening balances from CSV
router.post('/opening-balance', authenticate, requireRole('admin'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });
    if (!req.user.company_id) return res.status(400).json({ error: 'No company context' });

    const rows = parseCSV(req.file.buffer);
    const results = { total: rows.length, updated: 0, skipped: 0, errors: [] };

    for (const [i, row] of rows.entries()) {
      try {
        if (!row.account_code) { results.errors.push({ row: i + 2, error: 'account_code required' }); results.skipped++; continue; }
        const amount = parseFloat(row.opening_balance) || 0;
        const updated = await ChartOfAccount.findOneAndUpdate(
          { company_id: req.user.company_id, account_code: row.account_code },
          { $set: { opening_balance: amount, current_balance: amount } }
        );
        if (updated) results.updated++; else results.skipped++;
      } catch (e) {
        results.errors.push({ row: i + 2, error: e.message });
        results.skipped++;
      }
    }
    res.json({ message: 'Opening balance import complete', ...results });
  } catch (err) { next(err); }
});

// POST /api/import/suppliers
router.post('/suppliers', authenticate, requireRole('admin', 'manager'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });
    if (!req.user.company_id) return res.status(400).json({ error: 'No company context' });
    const rows = parseCSV(req.file.buffer);
    const results = { total: rows.length, inserted: 0, skipped: 0, errors: [] };
    // Dynamic require in case Supplier model exists
    let Supplier;
    try { Supplier = require('../models/Supplier'); } catch { return res.status(501).json({ error: 'Supplier model not found' }); }
    for (const [i, row] of rows.entries()) {
      try {
        if (!row.name) { results.errors.push({ row: i + 2, error: 'name required' }); results.skipped++; continue; }
        await Supplier.create({ company_id: req.user.company_id, ...row, is_active: true });
        results.inserted++;
      } catch (e) {
        results.errors.push({ row: i + 2, error: e.message });
        results.skipped++;
      }
    }
    res.json({ message: 'Supplier import complete', ...results });
  } catch (err) { next(err); }
});

module.exports = router;
