/**
 * LocalWheels — Pilot Company Onboarding Script
 * Onboards up to 3 pilot companies with full master data.
 *
 * Usage:
 *   node src/scripts/onboard-pilot.js                    # onboard all 3 companies
 *   node src/scripts/onboard-pilot.js --company 2        # onboard only company 2
 *   node src/scripts/onboard-pilot.js --list             # list what would be created
 *
 * Env:
 *   MONGODB_URI  (required — from .env)
 *
 * Each company gets:
 *   - 1 Company record
 *   - 3 Branches (HQ + 2 regional)
 *   - Admin user + branch_manager + dispatcher + staff
 *   - 5 Customers
 *   - 5 Vehicles
 *   - 5 Drivers
 *   - 1 Warehouse
 *   - 10 Inventory items
 *   - Chart of Accounts (20 accounts)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const listOnly = args.includes('--list');
const onlyIdx  = args.includes('--company') ? parseInt(args[args.indexOf('--company') + 1], 10) - 1 : null;

const log  = (msg) => console.log(`  ✅  ${msg}`);
const warn = (msg) => console.log(`  ⚠️   ${msg}`);
const head = (msg) => console.log(`\n── ${msg} ──`);
const err  = (msg) => console.log(`  ❌  ${msg}`);

// ── Pilot company definitions ─────────────────────────────────────────────────
const PILOT_COMPANIES = [
  {
    name:    'Sunrise Logistics Pvt Ltd',
    code:    'SL001',
    gstin:   '27AABCS1234L1ZR',
    pan:     'AABCS1234L',
    address: '45 Logistics Park, Andheri East, Mumbai, Maharashtra 400059',
    phone:   '022-11223344',
    email:   'admin@sunriselogistics.com',
    city:    'Mumbai',
    state:   'Maharashtra',
    admin: { username: 'sunrise_admin', email: 'admin@sunriselogistics.com' },
    branches: [
      { name: 'Mumbai HQ',    city: 'Mumbai',    state: 'Maharashtra', code: 'SL-MUM' },
      { name: 'Pune Branch',  city: 'Pune',      state: 'Maharashtra', code: 'SL-PUN' },
      { name: 'Nashik Branch',city: 'Nashik',    state: 'Maharashtra', code: 'SL-NSK' },
    ],
    customers: [
      { name: 'Reliance Industries',  phone: '9000000001', email: 'logistics@ril.com',   city: 'Mumbai', gstin: '27AAACR0456B1ZR' },
      { name: 'Tata Motors Ltd',      phone: '9000000002', email: 'supply@tatamotors.com', city: 'Pune',   gstin: '27AAACT5555B1ZR' },
      { name: 'Mahindra & Mahindra',  phone: '9000000003', email: 'vendor@mahindra.com',  city: 'Mumbai', gstin: '27AAACM1234C1ZR' },
      { name: 'Bajaj Auto Ltd',       phone: '9000000004', email: 'dispatch@bajaj.com',   city: 'Pune',   gstin: '27AABCB2345D1ZR' },
      { name: 'Thermax Limited',      phone: '9000000005', email: 'purchase@thermax.com', city: 'Pune',   gstin: '27AABCT6789E1ZR' },
    ],
    vehicles: [
      { reg: 'MH-01-AB-1234', type: 'truck', model: 'Tata Prima', capacity: 20000 },
      { reg: 'MH-01-AB-1235', type: 'truck', model: 'Tata Prima', capacity: 20000 },
      { reg: 'MH-01-CD-5678', type: 'mini_truck', model: 'Tata Ace', capacity: 750 },
      { reg: 'MH-01-CD-5679', type: 'mini_truck', model: 'Mahindra Bolero Camper', capacity: 1000 },
      { reg: 'MH-02-EF-9012', type: 'trailer', model: 'Ashok Leyland 40ft', capacity: 30000 },
    ],
    drivers: [
      { name: 'Ramesh Patil',   phone: '9111000001', license: 'MH0120250001', license_type: 'Heavy' },
      { name: 'Suresh Jadhav',  phone: '9111000002', license: 'MH0120250002', license_type: 'Heavy' },
      { name: 'Mahesh Shinde',  phone: '9111000003', license: 'MH0120250003', license_type: 'LMV' },
      { name: 'Rajesh Gaikwad', phone: '9111000004', license: 'MH0220250004', license_type: 'LMV' },
      { name: 'Ganesh More',    phone: '9111000005', license: 'MH0120250005', license_type: 'Heavy' },
    ],
    warehouse: { name: 'Sunrise Mumbai Warehouse', city: 'Mumbai', capacity: 50000 },
  },

  {
    name:    'Northern Star Transport Co',
    code:    'NS001',
    gstin:   '07AABCN4567L1ZR',
    pan:     'AABCN4567L',
    address: '12 Transport Colony, Okhla Phase 2, New Delhi 110020',
    phone:   '011-55667788',
    email:   'admin@northernstar.in',
    city:    'Delhi',
    state:   'Delhi',
    admin: { username: 'nstar_admin', email: 'admin@northernstar.in' },
    branches: [
      { name: 'Delhi HQ',       city: 'New Delhi', state: 'Delhi',         code: 'NS-DEL' },
      { name: 'Gurgaon Branch', city: 'Gurgaon',   state: 'Haryana',       code: 'NS-GGN' },
      { name: 'Noida Branch',   city: 'Noida',     state: 'Uttar Pradesh', code: 'NS-NOI' },
    ],
    customers: [
      { name: 'HCL Technologies',    phone: '9200000001', email: 'scm@hcl.com',       city: 'Noida',     gstin: '09AAACH1234A1ZR' },
      { name: 'Hero MotoCorp',       phone: '9200000002', email: 'logistics@hero.com', city: 'Delhi',     gstin: '07AAACH5678B1ZR' },
      { name: 'Maruti Suzuki India', phone: '9200000003', email: 'vendor@maruti.com',  city: 'Gurgaon',   gstin: '06AAACM2345C1ZR' },
      { name: 'Samsung India',       phone: '9200000004', email: 'supply@samsung.in',  city: 'Noida',     gstin: '09AAACS6789D1ZR' },
      { name: 'Havells India',       phone: '9200000005', email: 'purchase@havells.com', city: 'Noida',   gstin: '09AAACH9012E1ZR' },
    ],
    vehicles: [
      { reg: 'DL-01-AB-2345', type: 'truck',      model: 'Eicher Pro 6016', capacity: 16000 },
      { reg: 'DL-01-AB-2346', type: 'truck',      model: 'Eicher Pro 6016', capacity: 16000 },
      { reg: 'DL-01-CD-6789', type: 'mini_truck', model: 'Tata Ace Gold',   capacity: 750 },
      { reg: 'HR-26-EF-1234', type: 'truck',      model: 'BharatBenz 2823', capacity: 22000 },
      { reg: 'UP-14-GH-5678', type: 'van',        model: 'Force Traveller', capacity: 500 },
    ],
    drivers: [
      { name: 'Vikram Singh',    phone: '9222000001', license: 'DL0120250001', license_type: 'Heavy' },
      { name: 'Amit Sharma',     phone: '9222000002', license: 'DL0120250002', license_type: 'Heavy' },
      { name: 'Sunil Yadav',     phone: '9222000003', license: 'HR2620250003', license_type: 'LMV' },
      { name: 'Ravi Kumar',      phone: '9222000004', license: 'UP1420250004', license_type: 'LMV' },
      { name: 'Pankaj Verma',    phone: '9222000005', license: 'DL0120250005', license_type: 'Heavy' },
    ],
    warehouse: { name: 'Northern Star Delhi Warehouse', city: 'New Delhi', capacity: 35000 },
  },

  {
    name:    'South Express Cargo Services',
    code:    'SE001',
    gstin:   '29AABCS7890L1ZR',
    pan:     'AABCS7890L',
    address: '78 Peenya Industrial Area, Bengaluru, Karnataka 560058',
    phone:   '080-99887766',
    email:   'admin@southexpresscargo.com',
    city:    'Bengaluru',
    state:   'Karnataka',
    admin: { username: 'southex_admin', email: 'admin@southexpresscargo.com' },
    branches: [
      { name: 'Bengaluru HQ',    city: 'Bengaluru', state: 'Karnataka',       code: 'SE-BLR' },
      { name: 'Chennai Branch',  city: 'Chennai',   state: 'Tamil Nadu',      code: 'SE-CHN' },
      { name: 'Hyderabad Branch',city: 'Hyderabad', state: 'Telangana',       code: 'SE-HYD' },
    ],
    customers: [
      { name: 'Infosys Limited',     phone: '9300000001', email: 'facilities@infosys.com', city: 'Bengaluru', gstin: '29AAACI1234A1ZR' },
      { name: 'Wipro Limited',       phone: '9300000002', email: 'logistics@wipro.com',    city: 'Bengaluru', gstin: '29AAACW5678B1ZR' },
      { name: 'Bosch India',         phone: '9300000003', email: 'supply@bosch.in',        city: 'Bengaluru', gstin: '29AAACB2345C1ZR' },
      { name: 'TVS Motor Company',   phone: '9300000004', email: 'vendor@tvs.com',         city: 'Chennai',   gstin: '33AAACT6789D1ZR' },
      { name: 'Bharat Forge Ltd',    phone: '9300000005', email: 'purchase@bharatforge.com', city: 'Pune',   gstin: '27AAACB9012E1ZR' },
    ],
    vehicles: [
      { reg: 'KA-01-AB-3456', type: 'truck',      model: 'Volvo FM 440',    capacity: 25000 },
      { reg: 'KA-01-AB-3457', type: 'truck',      model: 'Volvo FM 440',    capacity: 25000 },
      { reg: 'TN-09-CD-7890', type: 'mini_truck', model: 'Tata Ace Zip',    capacity: 600 },
      { reg: 'KA-01-EF-2345', type: 'trailer',    model: 'Leyland 49 Ton',  capacity: 40000 },
      { reg: 'TS-09-GH-6789', type: 'truck',      model: 'Eicher Pro 8031', capacity: 25000 },
    ],
    drivers: [
      { name: 'Krishnamurthy R',  phone: '9333000001', license: 'KA0120250001', license_type: 'Heavy' },
      { name: 'Venkatesh S',      phone: '9333000002', license: 'KA0120250002', license_type: 'Heavy' },
      { name: 'Murugan P',        phone: '9333000003', license: 'TN0920250003', license_type: 'Heavy' },
      { name: 'Srinivas N',       phone: '9333000004', license: 'TS0920250004', license_type: 'LMV' },
      { name: 'Rajashekar M',     phone: '9333000005', license: 'KA0120250005', license_type: 'Heavy' },
    ],
    warehouse: { name: 'South Express Bengaluru Warehouse', city: 'Bengaluru', capacity: 45000 },
  },
];

// ── Inventory item templates ──────────────────────────────────────────────────
function inventoryItems(companyId, warehouseId) {
  const items = [
    { sku: 'AUTO-PARTS-001', product_name: 'Engine Oil (5L)',           category: 'Auto Parts',   uom: 'Box',    qty: 200,  cost: 500 },
    { sku: 'ELEC-COMP-001',  product_name: 'Electronic Components Box', category: 'Electronics',  uom: 'Box',    qty: 150,  cost: 750 },
    { sku: 'GARMENT-001',    product_name: 'Garment Bundle',            category: 'Textiles',     uom: 'Kg',     qty: 5000, cost: 200 },
    { sku: 'PHARMA-001',     product_name: 'Pharmaceutical Carton',     category: 'Pharma',       uom: 'Carton', qty: 300,  cost: 1000 },
    { sku: 'FMCG-001',       product_name: 'FMCG Mixed Pallet',         category: 'FMCG',         uom: 'Pallet', qty: 80,   cost: 5000 },
    { sku: 'MACHINERY-001',  product_name: 'Industrial Machinery Part', category: 'Machinery',    uom: 'Unit',   qty: 25,   cost: 15000 },
    { sku: 'CHEMICAL-001',   product_name: 'Chemical Drum 200L',        category: 'Chemicals',    uom: 'Drum',   qty: 40,   cost: 2500 },
    { sku: 'AGRI-001',       product_name: 'Agricultural Produce',      category: 'Agriculture',  uom: 'Ton',    qty: 120,  cost: 3000 },
    { sku: 'STEEL-001',      product_name: 'Steel Coil MT',             category: 'Steel',        uom: 'MT',     qty: 60,   cost: 45000 },
    { sku: 'RETAIL-001',     product_name: 'Retail Carton Mixed',       category: 'Retail',       uom: 'Carton', qty: 500,  cost: 800 },
  ];
  return items.map((item, i) => ({
    company_id:   companyId,
    warehouse_id: warehouseId,
    sku:          item.sku,
    product_name: item.product_name,
    category:     item.category,
    uom:          item.uom,
    quantity:     item.qty,
    unit_cost:    item.cost,
    total_value:  item.qty * item.cost,
    bin_location: `Rack-${String.fromCharCode(65 + i)}-01`,
    status:       'available',
    createdAt:    new Date(),
    updatedAt:    new Date(),
  }));
}

// ── Chart of Accounts (20 standard accounts) ─────────────────────────────────
function chartOfAccounts(companyId) {
  return [
    { code: '1001', name: 'Cash & Cash Equivalents', type: 'cash' },
    { code: '1002', name: 'Accounts Receivable',     type: 'asset' },
    { code: '1003', name: 'Inventory',               type: 'asset' },
    { code: '1004', name: 'Prepaid Expenses',        type: 'asset' },
    { code: '1101', name: 'Vehicles & Fleet',        type: 'fixed_asset' },
    { code: '1102', name: 'Warehouse & Buildings',   type: 'fixed_asset' },
    { code: '1103', name: 'Equipment & Machinery',   type: 'fixed_asset' },
    { code: '2001', name: 'Accounts Payable',        type: 'liability' },
    { code: '2002', name: 'Accrued Expenses',        type: 'liability' },
    { code: '2003', name: 'GST Payable',             type: 'liability' },
    { code: '2101', name: 'Long-Term Debt',          type: 'liability' },
    { code: '3001', name: 'Owner Equity',            type: 'equity' },
    { code: '3002', name: 'Retained Earnings',       type: 'equity' },
    { code: '4001', name: 'Freight Revenue',         type: 'income' },
    { code: '4002', name: 'Warehouse Revenue',       type: 'income' },
    { code: '4003', name: 'Other Revenue',           type: 'income' },
    { code: '5001', name: 'Driver & Staff Salaries', type: 'expense' },
    { code: '5002', name: 'Fuel Expenses',           type: 'expense' },
    { code: '5003', name: 'Vehicle Maintenance',     type: 'expense' },
    { code: '5004', name: 'Admin & Office Expenses', type: 'expense' },
  ].map(a => ({
    company_id:       companyId,
    account_code:     a.code,
    account_name:     a.name,
    account_type:     a.type,
    level:            1,
    is_leaf:          true,
    opening_balance:  0,
    current_balance:  0,
    currency:         'INR',
    is_active:        true,
    tags:             [],
    createdAt:        new Date(),
    updatedAt:        new Date(),
  }));
}

// ── Main onboarding function ──────────────────────────────────────────────────
async function onboardCompany(companyDef, index) {
  const db = mongoose.connection.db;
  const label = `[Company ${index + 1}] ${companyDef.name}`;
  head(label);

  // ── Company ────────────────────────────────────────────────────────────────
  let company = await db.collection('companies').findOne({ code: companyDef.code });
  if (!company) {
    const r = await db.collection('companies').insertOne({
      name:             companyDef.name,
      code:             companyDef.code,
      gstin:            companyDef.gstin,
      pan:              companyDef.pan,
      address:          companyDef.address,
      phone:            companyDef.phone,
      email:            companyDef.email,
      website:          `https://${companyDef.email.split('@')[1]}`,
      city:             companyDef.city,
      state:            companyDef.state,
      industry:         'Logistics & Transportation',
      size:             'medium',
      is_active:        true,
      subscription_plan:'enterprise',
      onboarded_at:     new Date(),
      current_fy_start: new Date('2026-04-01'),
      current_fy_end:   new Date('2027-03-31'),
      financial_year:   '2026-27',
      pilot:            true,
      createdAt:        new Date(),
      updatedAt:        new Date(),
    });
    company = { _id: r.insertedId, ...companyDef };
    log(`Company created: ${companyDef.name} (${companyDef.code})`);
  } else {
    warn(`Company already exists: ${companyDef.name}`);
  }
  const companyId = company._id;

  // ── Branches ───────────────────────────────────────────────────────────────
  const branchIds = {};
  for (const bd of companyDef.branches) {
    let branch = await db.collection('branches').findOne({ company_id: companyId, code: bd.code });
    if (!branch) {
      const r = await db.collection('branches').insertOne({
        company_id:  companyId,
        branch_name: bd.name,
        code:        bd.code,
        city:        bd.city,
        state:       bd.state,
        is_active:   true,
        createdAt:   new Date(),
        updatedAt:   new Date(),
      });
      branch = { _id: r.insertedId };
      log(`Branch: ${bd.name} (${bd.code})`);
    } else {
      warn(`Branch exists: ${bd.name}`);
    }
    branchIds[bd.code] = branch._id;
  }
  const hqBranchId = Object.values(branchIds)[0];

  // ── Admin user ─────────────────────────────────────────────────────────────
  const adminPassword = `Pilot@${companyDef.code}#2026`;
  let adminUser = await db.collection('users').findOne({ username: companyDef.admin.username });
  if (!adminUser) {
    const hash = await bcrypt.hash(adminPassword, 10);
    const r = await db.collection('users').insertOne({
      company_id:  companyId,
      branch_id:   hqBranchId,
      username:    companyDef.admin.username,
      email:       companyDef.admin.email,
      password:    hash,
      role:        'admin',
      name:        `Admin — ${companyDef.name}`,
      is_active:   true,
      createdAt:   new Date(),
      updatedAt:   new Date(),
    });
    adminUser = { _id: r.insertedId };
    log(`Admin user: ${companyDef.admin.username} / ${adminPassword}`);
  } else {
    warn(`Admin user exists: ${companyDef.admin.username}`);
  }

  // Branch manager + dispatcher for HQ
  for (const userDef of [
    { username: `${companyDef.code.toLowerCase()}_mgr`, role: 'branch_manager', name: 'Branch Manager' },
    { username: `${companyDef.code.toLowerCase()}_disp`, role: 'dispatcher', name: 'Dispatcher' },
  ]) {
    const exists = await db.collection('users').findOne({ username: userDef.username });
    if (!exists) {
      const hash = await bcrypt.hash(`Staff@${companyDef.code}#2026`, 10);
      await db.collection('users').insertOne({
        company_id: companyId, branch_id: hqBranchId,
        username: userDef.username, email: `${userDef.username}@pilot.com`,
        password: hash, role: userDef.role, name: userDef.name,
        is_active: true, createdAt: new Date(), updatedAt: new Date(),
      });
      log(`User: ${userDef.username} (${userDef.role})`);
    }
  }

  // ── Customers ──────────────────────────────────────────────────────────────
  let customerCount = 0;
  for (const cd of companyDef.customers) {
    const exists = await db.collection('customers').findOne({ company_id: companyId, phone: cd.phone });
    if (!exists) {
      await db.collection('customers').insertOne({
        company_id:  companyId,
        branch_id:   hqBranchId,
        name:        cd.name,
        phone:       cd.phone,
        email:       cd.email,
        city:        cd.city,
        gstin:       cd.gstin,
        customer_type: 'corporate',
        credit_limit:  500000,
        credit_days:   30,
        is_active:     true,
        createdAt:     new Date(),
        updatedAt:     new Date(),
      });
      customerCount++;
    }
  }
  log(`Customers: ${customerCount} imported`);

  // ── Vehicles ───────────────────────────────────────────────────────────────
  let vehicleCount = 0;
  for (const vd of companyDef.vehicles) {
    const exists = await db.collection('vehicles').findOne({ company_id: companyId, registration_number: vd.reg });
    if (!exists) {
      await db.collection('vehicles').insertOne({
        company_id:          companyId,
        branch_id:           hqBranchId,
        registration_number: vd.reg,
        vehicle_type:        vd.type,
        model:               vd.model,
        capacity_tons:       Math.round(vd.capacity / 1000),
        status:              'available',
        year:                2024,
        insurance_expiry:    new Date('2027-03-31'),
        fitness_expiry:      new Date('2027-03-31'),
        permit_expiry:       new Date('2027-03-31'),
        createdAt:           new Date(),
        updatedAt:           new Date(),
      });
      vehicleCount++;
    }
  }
  log(`Vehicles: ${vehicleCount} imported`);

  // ── Drivers ────────────────────────────────────────────────────────────────
  let driverCount = 0;
  for (const dd of companyDef.drivers) {
    const exists = await db.collection('drivers').findOne({ company_id: companyId, phone: dd.phone });
    if (!exists) {
      await db.collection('drivers').insertOne({
        company_id:     companyId,
        branch_id:      hqBranchId,
        name:           dd.name,
        phone:          dd.phone,
        license_number: dd.license,
        license_expiry: new Date('2030-12-31'),
        status:         'available',
        createdAt:      new Date(),
        updatedAt:      new Date(),
      });
      driverCount++;
    }
  }
  log(`Drivers: ${driverCount} imported`);

  // ── Warehouse ──────────────────────────────────────────────────────────────
  let warehouseId;
  let wh = await db.collection('warehouses').findOne({ company_id: companyId, name: companyDef.warehouse.name });
  if (!wh) {
    const r = await db.collection('warehouses').insertOne({
      company_id:    companyId,
      branch_id:     hqBranchId,
      name:          companyDef.warehouse.name,
      city:          companyDef.warehouse.city,
      capacity_sqft: companyDef.warehouse.capacity,
      current_occupancy: 0,
      type:          'general',
      status:        'active',
      createdAt:     new Date(),
      updatedAt:     new Date(),
    });
    warehouseId = r.insertedId;
    log(`Warehouse: ${companyDef.warehouse.name}`);
  } else {
    warehouseId = wh._id;
    warn(`Warehouse exists: ${companyDef.warehouse.name}`);
  }

  // ── Inventory ──────────────────────────────────────────────────────────────
  const existingInv = await db.collection('inventories').countDocuments({ company_id: companyId });
  if (existingInv === 0) {
    const items = inventoryItems(companyId, warehouseId);
    await db.collection('inventories').insertMany(items);
    log(`Inventory: ${items.length} items loaded`);
  } else {
    warn(`Inventory: ${existingInv} items already exist`);
  }

  // ── Chart of Accounts ──────────────────────────────────────────────────────
  const existingCOA = await db.collection('chartofaccounts').countDocuments({ company_id: companyId });
  if (existingCOA === 0) {
    const accounts = chartOfAccounts(companyId);
    await db.collection('chartofaccounts').insertMany(accounts);
    log(`Chart of Accounts: ${accounts.length} accounts created`);
  } else {
    warn(`Chart of Accounts: ${existingCOA} accounts already exist`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n  📋  Onboarding Summary — ${companyDef.name}`);
  console.log(`      Admin login:  ${companyDef.admin.username} / ${adminPassword}`);
  console.log(`      Staff login:  ${companyDef.code.toLowerCase()}_mgr / Staff@${companyDef.code}#2026`);
  console.log(`      Branches:     ${companyDef.branches.length}`);
  console.log(`      Customers:    ${companyDef.customers.length}`);
  console.log(`      Vehicles:     ${companyDef.vehicles.length}`);
  console.log(`      Drivers:      ${companyDef.drivers.length}`);
  console.log(`      Warehouse:    1 (${companyDef.warehouse.capacity.toLocaleString()} sqft)`);
  console.log(`      Inventory:    10 SKUs`);
  console.log(`      Accounts:     20 (full Chart of Accounts)`);

  return {
    company_name: companyDef.name,
    admin_username: companyDef.admin.username,
    admin_password: adminPassword,
    branches: companyDef.branches.length,
    customers: companyDef.customers.length,
    vehicles: companyDef.vehicles.length,
    drivers: companyDef.drivers.length,
  };
}

// ── Entry point ───────────────────────────────────────────────────────────────
async function main() {
  if (listOnly) {
    console.log('\n📋  Pilot Companies to be onboarded:\n');
    PILOT_COMPANIES.forEach((c, i) => {
      console.log(`  Company ${i + 1}: ${c.name} (${c.code})`);
      console.log(`    Admin: ${c.admin.username}`);
      console.log(`    Branches: ${c.branches.map(b => b.name).join(', ')}`);
      console.log(`    Customers: ${c.customers.length} | Vehicles: ${c.vehicles.length} | Drivers: ${c.drivers.length}`);
      console.log('');
    });
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error('\n❌  MONGODB_URI is not set. Copy .env.example → .env and fill in values.\n');
    process.exit(1);
  }

  console.log('\n🚀  LocalWheels — Pilot Company Onboarding');
  console.log('─'.repeat(50));

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  Connected to MongoDB');

  const toOnboard = onlyIdx !== null
    ? [PILOT_COMPANIES[onlyIdx]].filter(Boolean)
    : PILOT_COMPANIES;

  if (onlyIdx !== null && !PILOT_COMPANIES[onlyIdx]) {
    console.error(`\n❌  Company ${onlyIdx + 1} does not exist. Valid range: 1–${PILOT_COMPANIES.length}\n`);
    process.exit(1);
  }

  const results = [];
  for (let i = 0; i < toOnboard.length; i++) {
    const result = await onboardCompany(toOnboard[i], onlyIdx !== null ? onlyIdx : i);
    results.push(result);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('  ONBOARDING COMPLETE');
  console.log('═'.repeat(60));
  results.forEach((r, i) => {
    console.log(`\n  Company ${i + 1}: ${r.company_name}`);
    console.log(`  Login: ${r.admin_username} / ${r.admin_password}`);
    console.log(`  ⚠️   Change admin password after first login!`);
  });
  console.log('\n  Next steps:');
  console.log('  1. Share login credentials with each customer');
  console.log('  2. Schedule onboarding call (30–60 min per company)');
  console.log('  3. Guide through Lead → Shipment workflow');
  console.log('  4. Enable AI features (set ANTHROPIC_API_KEY in production)');
  console.log('  5. Monitor dashboard for first 48 hours\n');

  await mongoose.disconnect();
}

main().catch(e => {
  console.error('\n❌  Onboarding failed:', e.message);
  console.error(e.stack);
  process.exit(1);
});
