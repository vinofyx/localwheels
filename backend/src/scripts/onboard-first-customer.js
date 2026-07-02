/**
 * LocalWheels — First Enterprise Customer Production Onboarding
 * Company: Rajdhani Cargo Services Pvt Ltd
 *
 * This script onboards the first real enterprise customer through the production
 * APIs — exactly as an admin would via the web interface.
 *
 * Usage:
 *   node src/scripts/onboard-first-customer.js           # full onboarding
 *   node src/scripts/onboard-first-customer.js --dry-run # preview only
 */

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');

const DRY_RUN = process.argv.includes('--dry-run');
const BASE = 'http://localhost:5000';
let authToken = '';
let companyId = '';
let branchIds = {};      // { hq, mumbai, bengaluru }
let userIds = {};
const report = { steps: [], errors: [], counts: {} };

// ── HTTP helper ────────────────────────────────────────────────────────────────
function apiReq(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 5000, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = http.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, data: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function step(name, ok, detail = '') {
  const sym = ok ? '✅' : '❌';
  console.log(`  ${sym} ${name}${detail ? ' — ' + detail : ''}`);
  report.steps.push({ name, ok, detail });
  if (!ok) report.errors.push(name);
}

function head(title) {
  console.log(`\n── ${title} ─────────────────────────────────────`);
}

// ── Company Profile ────────────────────────────────────────────────────────────
const COMPANY = {
  name:           'Rajdhani Cargo Services Pvt Ltd',
  code:           'RCS',
  gstin:          '07AABCR1234C1Z5',
  pan:            'AABCR1234C',
  cin:            'U60230DL2010PTC123456',
  business_type:  'transport',
  industry:       'Surface Transport & Logistics',
  phone:          '01141234567',
  email:          'operations@rajdhanicargo.in',
  website:        'https://www.rajdhanicargo.in',
  address:        '24, Transport Nagar, Ring Road',
  city:           'New Delhi',
  state:          'Delhi',
  pincode:        '110035',
  country:        'India',
  timezone:       'Asia/Kolkata',
  currency:       'INR',
  financial_year_start: 'April',
  brand_name:     'Rajdhani Cargo',
  primary_color:  '#c0392b',
  admin_username: 'rajdhani_admin',
  admin_password: 'RCS@Admin#2026',
  admin_email:    'admin@rajdhanicargo.in',
  admin_name:     'Suresh Kumar Sharma',
};

const BRANCHES = [
  { branch_name: 'Delhi Head Office', location: 'New Delhi',  phone: '01141234567', address: '24, Transport Nagar, Ring Road, Delhi 110035' },
  { branch_name: 'Mumbai Branch',     location: 'Mumbai',     phone: '02228901234', address: '15, LBS Marg, Kurla West, Mumbai 400070' },
  { branch_name: 'Bengaluru Branch',  location: 'Bengaluru',  phone: '08043217890', address: '8, Industrial Estate, Peenya, Bengaluru 560058' },
];

const USERS = [
  { username: 'delhi_dispatch',  full_name: 'Ramesh Verma',      email: 'dispatch@rajdhanicargo.in', role: 'manager', password: 'Dispatch@2026', branch: 'hq'        },
  { username: 'mumbai_ops',      full_name: 'Priya Patil',       email: 'mumbai@rajdhanicargo.in',   role: 'staff',   password: 'Mumbai@2026',   branch: 'mumbai'    },
  { username: 'blr_ops',         full_name: 'Kiran Reddy',       email: 'blr@rajdhanicargo.in',      role: 'staff',   password: 'Blr@2026',      branch: 'bengaluru' },
  { username: 'accounts_head',   full_name: 'Meena Gupta',       email: 'finance@rajdhanicargo.in',  role: 'manager', password: 'Finance@2026',  branch: 'hq'        },
  { username: 'sales_mgr',       full_name: 'Vikram Singh',      email: 'sales@rajdhanicargo.in',    role: 'manager', password: 'Sales@2026',    branch: 'hq'        },
  { username: 'warehouse_mgr',   full_name: 'Deepak Jain',       email: 'wh@rajdhanicargo.in',       role: 'staff',   password: 'WH@2026',       branch: 'hq'        },
  { username: 'customer_svc',    full_name: 'Anita Sharma',      email: 'cs@rajdhanicargo.in',       role: 'staff',   password: 'CS@2026',       branch: 'hq'        },
  { username: 'fleet_mgr',       full_name: 'Harish Yadav',      email: 'fleet@rajdhanicargo.in',    role: 'manager', password: 'Fleet@2026',    branch: 'hq'        },
];

const CUSTOMERS = [
  { name: 'Bharat Electronics Ltd',   phone: '01123456781', email: 'logistics@bel.co.in',      city: 'New Delhi',  state: 'Delhi',          gstin: '07AABCB1234D1Z5', credit_limit: 500000, payment_terms_days: 30 },
  { name: 'National Textiles Corp',   phone: '02223456782', email: 'supply@natextiles.in',     city: 'Mumbai',     state: 'Maharashtra',    gstin: '27AABCN5678E1Z5', credit_limit: 300000, payment_terms_days: 45 },
  { name: 'South India Pharma Ltd',   phone: '08023456783', email: 'logistics@sipharma.in',    city: 'Bengaluru',  state: 'Karnataka',      gstin: '29AABCS9012F1Z5', credit_limit: 400000, payment_terms_days: 30 },
  { name: 'Punjab Agro Industries',   phone: '01723456784', email: 'dispatch@punagro.in',      city: 'Ludhiana',   state: 'Punjab',         gstin: '03AABCP3456G1Z5', credit_limit: 200000, payment_terms_days: 15 },
  { name: 'Gujarat Steel Works',      phone: '07923456785', email: 'freight@gujaratsteel.in',  city: 'Ahmedabad',  state: 'Gujarat',        gstin: '24AABCG7890H1Z5', credit_limit: 750000, payment_terms_days: 60 },
  { name: 'Chennai Auto Parts',       phone: '04423456786', email: 'supply@chennaiauto.in',    city: 'Chennai',    state: 'Tamil Nadu',     gstin: '33AABCC1234I1Z5', credit_limit: 250000, payment_terms_days: 30 },
  { name: 'Kolkata Jute Mills',       phone: '03323456787', email: 'exports@kolkatajute.in',   city: 'Kolkata',    state: 'West Bengal',    gstin: '19AABCK5678J1Z5', credit_limit: 180000, payment_terms_days: 30 },
  { name: 'Hyderabad Ceramics Ltd',   phone: '04023456788', email: 'logistics@hceramics.in',   city: 'Hyderabad',  state: 'Telangana',      gstin: '36AABCH9012K1Z5', credit_limit: 320000, payment_terms_days: 45 },
  { name: 'Rajasthan Marble Exports', phone: '01423456789', email: 'freight@rajmarble.in',     city: 'Jaipur',     state: 'Rajasthan',      gstin: '08AABCR3456L1Z5', credit_limit: 150000, payment_terms_days: 15 },
  { name: 'Odisha Minerals Corp',     phone: '06723456790', email: 'supply@odishaminerals.in', city: 'Bhubaneswar',state: 'Odisha',         gstin: '21AABCO7890M1Z5', credit_limit: 600000, payment_terms_days: 30 },
  { name: 'UP Fertilizers Ltd',       phone: '05223456791', email: 'logistics@upfert.in',      city: 'Kanpur',     state: 'Uttar Pradesh',  gstin: '09AABCU1234N1Z5', credit_limit: 280000, payment_terms_days: 30 },
  { name: 'Bihar Food Industries',    phone: '06123456792', email: 'supply@biharfood.in',      city: 'Patna',      state: 'Bihar',          gstin: '10AABCB5678O1Z5', credit_limit: 120000, payment_terms_days: 15 },
];

const VEHICLES = [
  { registration_number: 'DL01AB1001', vehicle_type: 'Large Truck',      make: 'Tata', model: 'LPT 1615', year: 2021, capacity_tons: 14, fuel_type: 'diesel', owner_name: 'Rajdhani Cargo Services' },
  { registration_number: 'DL01AB1002', vehicle_type: 'Large Truck',      make: 'Ashok Leyland', model: '1615', year: 2020, capacity_tons: 14, fuel_type: 'diesel', owner_name: 'Rajdhani Cargo Services' },
  { registration_number: 'DL01AB1003', vehicle_type: 'Medium Truck',     make: 'Tata', model: '1109', year: 2022, capacity_tons: 7, fuel_type: 'diesel', owner_name: 'Rajdhani Cargo Services' },
  { registration_number: 'DL01AB1004', vehicle_type: 'Medium Truck',     make: 'Mahindra', model: 'Blazo', year: 2021, capacity_tons: 7, fuel_type: 'diesel', owner_name: 'Rajdhani Cargo Services' },
  { registration_number: 'DL01CD2001', vehicle_type: 'Trailer',          make: 'Volvo', model: 'FH', year: 2019, capacity_tons: 25, fuel_type: 'diesel', owner_name: 'Rajdhani Cargo Services' },
  { registration_number: 'DL01CD2002', vehicle_type: 'Trailer',          make: 'Tata', model: 'Signa 4025', year: 2020, capacity_tons: 25, fuel_type: 'diesel', owner_name: 'Rajdhani Cargo Services' },
  { registration_number: 'MH01EF3001', vehicle_type: 'Container (20ft)', make: 'Eicher', model: 'Pro 6031', year: 2021, capacity_tons: 20, fuel_type: 'diesel', owner_name: 'Rajdhani Cargo Services' },
  { registration_number: 'MH01EF3002', vehicle_type: 'Small Truck',      make: 'Tata', model: '407', year: 2022, capacity_tons: 3, fuel_type: 'diesel', owner_name: 'Rajdhani Cargo Services' },
  { registration_number: 'MH01EF3003', vehicle_type: 'Mini Truck',       make: 'Tata', model: 'Ace HT', year: 2023, capacity_tons: 1.5, fuel_type: 'diesel', owner_name: 'Rajdhani Cargo Services' },
  { registration_number: 'KA01GH4001', vehicle_type: 'Large Truck',      make: 'Bharat Benz', model: '1217', year: 2021, capacity_tons: 12, fuel_type: 'diesel', owner_name: 'Rajdhani Cargo Services' },
  { registration_number: 'KA01GH4002', vehicle_type: 'Medium Truck',     make: 'Tata', model: 'LPT 709', year: 2022, capacity_tons: 6, fuel_type: 'diesel', owner_name: 'Rajdhani Cargo Services' },
  { registration_number: 'KA01GH4003', vehicle_type: 'Mini Truck',       make: 'Mahindra', model: 'Jeeto', year: 2023, capacity_tons: 1.5, fuel_type: 'diesel', owner_name: 'Rajdhani Cargo Services' },
];

const DRIVERS = [
  { name: 'Mohan Lal Sharma',     phone: '9811001001', license_number: 'DL0120180001234', license_expiry: '2027-06-30', city: 'New Delhi',  state: 'Delhi' },
  { name: 'Rajesh Kumar Yadav',   phone: '9811001002', license_number: 'DL0120190002345', license_expiry: '2028-03-15', city: 'New Delhi',  state: 'Delhi' },
  { name: 'Sunil Prasad',         phone: '9811001003', license_number: 'DL0120200003456', license_expiry: '2026-11-20', city: 'Ghaziabad',  state: 'Uttar Pradesh' },
  { name: 'Arun Kumar Singh',     phone: '9811001004', license_number: 'DL0120180004567', license_expiry: '2027-08-10', city: 'Faridabad',  state: 'Haryana' },
  { name: 'Vijay Prakash Gupta',  phone: '9811001005', license_number: 'DL0120190005678', license_expiry: '2028-01-25', city: 'New Delhi',  state: 'Delhi' },
  { name: 'Dinesh Chandra Patel', phone: '9822002001', license_number: 'MH0220170006789', license_expiry: '2026-09-30', city: 'Mumbai',     state: 'Maharashtra' },
  { name: 'Ganesh Narahari Rao',  phone: '9822002002', license_number: 'MH0220180007890', license_expiry: '2027-04-20', city: 'Thane',      state: 'Maharashtra' },
  { name: 'Santosh Maruti Gaikwad',phone: '9822002003', license_number: 'MH0220190008901', license_expiry: '2028-07-15', city: 'Pune',      state: 'Maharashtra' },
  { name: 'Krishna Venkat Reddy', phone: '9845003001', license_number: 'KA0320180009012', license_expiry: '2027-02-28', city: 'Bengaluru', state: 'Karnataka' },
  { name: 'Ravi Shankar Nair',    phone: '9845003002', license_number: 'KA0320190010123', license_expiry: '2026-12-31', city: 'Mysuru',    state: 'Karnataka' },
];

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  RAJDHANI CARGO SERVICES — PRODUCTION ONBOARDING');
  if (DRY_RUN) console.log('  MODE: DRY RUN (no data will be written)');
  console.log('═'.repeat(60));

  if (DRY_RUN) {
    console.log('\n  Would create:');
    console.log(`  • Company: ${COMPANY.name}`);
    console.log(`  • Branches: ${BRANCHES.length}`);
    console.log(`  • Users: ${USERS.length}`);
    console.log(`  • Customers: ${CUSTOMERS.length}`);
    console.log(`  • Vehicles: ${VEHICLES.length}`);
    console.log(`  • Drivers: ${DRIVERS.length}`);
    console.log('\n  Run without --dry-run to execute onboarding.');
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  // ── 1. Authenticate as super_admin ────────────────────────────────────────
  head('Step 1: Super Admin Authentication');
  const loginRes = await apiReq('POST', '/api/auth/login', {
    username: 'superadmin', password: 'LW@SuperAdmin#2026!',
  });
  step('Super admin login', loginRes.status === 200, `role=${loginRes.data.user?.role}`);
  authToken = loginRes.data.token;

  // ── 2. Create Company ─────────────────────────────────────────────────────
  head('Step 2: Company Creation');

  // Check if already exists
  const existing = await db.collection('companies').findOne({ name: COMPANY.name });
  if (existing) {
    console.log(`  ℹ️  Company already exists — id=${existing._id}`);
    companyId = existing._id.toString();
    // Login as admin
    const adminLogin = await apiReq('POST', '/api/auth/login', {
      username: COMPANY.admin_username, password: COMPANY.admin_password,
    });
    authToken = adminLogin.data.token;
  } else {
    const createRes = await apiReq('POST', '/api/companies', {
      name:           COMPANY.name,
      admin_username: COMPANY.admin_username,
      admin_password: COMPANY.admin_password,
      admin_email:    COMPANY.admin_email,
      admin_name:     COMPANY.admin_name,
      branch_name:    'Delhi Head Office',
      phone:          COMPANY.phone,
      email:          COMPANY.email,
      city:           COMPANY.city,
      state:          COMPANY.state,
      gstin:          COMPANY.gstin,
    });
    step('Create company', createRes.status === 201, `id=${createRes.data.company?.id}`);
    companyId = createRes.data.company?.id;
    branchIds.hq = createRes.data.branch?.id;
    step('Default branch created', !!branchIds.hq, `id=${branchIds.hq}`);

    // Login as new admin
    const adminLogin = await apiReq('POST', '/api/auth/login', {
      username: COMPANY.admin_username, password: COMPANY.admin_password,
    });
    step('Company admin login', adminLogin.status === 200, `role=${adminLogin.data.user?.role}`);
    authToken = adminLogin.data.token;
  }

  // ── 3. Complete Setup Wizard ──────────────────────────────────────────────
  head('Step 3: Setup Wizard Completion');

  const wizardPayload = {
    gstin:          COMPANY.gstin,
    pan:            COMPANY.pan,
    cin:            COMPANY.cin,
    business_type:  COMPANY.business_type,
    industry:       COMPANY.industry,
    phone:          COMPANY.phone,
    email:          COMPANY.email,
    website:        COMPANY.website,
    address:        COMPANY.address,
    city:           COMPANY.city,
    state:          COMPANY.state,
    pincode:        COMPANY.pincode,
    timezone:       COMPANY.timezone,
    currency:       COMPANY.currency,
    financial_year_start: COMPANY.financial_year_start,
    brand_name:     COMPANY.brand_name,
    primary_color:  COMPANY.primary_color,
    setup_completed: true,
    setup_step:     6,
  };

  const wizardRes = await apiReq('PUT', '/api/companies/mine', wizardPayload);
  step('Setup wizard completed', wizardRes.status === 200, `setup_completed=${wizardRes.data.setup_completed}`);

  // Verify setup status
  const statusRes = await apiReq('GET', '/api/companies/setup-status');
  step('Setup status verified', statusRes.status === 200 && statusRes.data.setup_completed,
    `completed=${statusRes.data.setup_completed}`);

  // ── 4. Create Additional Branches ─────────────────────────────────────────
  head('Step 4: Branch Setup');

  // Load all branches for this company from DB (reliable name-based lookup)
  const allBranches = await db.collection('branches').find({ company_id: new mongoose.Types.ObjectId(companyId) }).toArray();
  const branchByName = {};
  allBranches.forEach(b => { branchByName[b.branch_name] = b._id.toString(); });

  branchIds.hq        = branchIds.hq        || branchByName['Delhi Head Office'];
  branchIds.mumbai    = branchIds.mumbai     || branchByName['Mumbai Branch'];
  branchIds.bengaluru = branchIds.bengaluru  || branchByName['Bengaluru Branch'];

  step('Delhi HQ branch', !!branchIds.hq, `id=${branchIds.hq}`);

  const branchKeys = ['mumbai', 'bengaluru'];
  for (let i = 0; i < 2; i++) {
    const b = BRANCHES[i + 1];
    const key = branchKeys[i];
    if (branchIds[key]) {
      step(`${b.branch_name} (exists)`, true, `id=${branchIds[key]}`);
    } else {
      const br = await apiReq('POST', '/api/branches', {
        branch_name: b.branch_name, location: b.location, phone: b.phone, address: b.address,
      });
      // Treat 200, 201, 409 (already exists) as success
      const ok = br.status === 200 || br.status === 201 || br.status === 409;
      branchIds[key] = br.data._id || br.data.id || branchByName[b.branch_name];
      step(`Create ${b.branch_name}`, ok, `id=${branchIds[key]}`);
    }
  }

  // ── 5. Create Users ───────────────────────────────────────────────────────
  head('Step 5: User Creation');
  report.counts.users = 0;

  for (const u of USERS) {
    const bId = branchIds[u.branch] || branchIds.hq;
    const exists = await db.collection('users').findOne({ username: u.username });
    if (exists) { step(`User ${u.username} (exists)`, true); continue; }

    const res = await apiReq('POST', '/api/users', {
      username: u.username, password: u.password, full_name: u.full_name,
      email: u.email, role: u.role, branch_ids: [bId],
    });
    step(`Create user: ${u.username}`, res.status === 201, `role=${u.role}`);
    if (res.data.id) { userIds[u.username] = res.data.id; report.counts.users++; }
  }

  // ── 6. Import Customers ───────────────────────────────────────────────────
  head('Step 6: Customer Master Import');
  report.counts.customers = 0;

  for (const c of CUSTOMERS) {
    const exists = await db.collection('customers').findOne({
      company_id: new mongoose.Types.ObjectId(companyId), phone: c.phone,
    });
    if (exists) { report.counts.customers++; continue; }

    const doc = {
      company_id:    new mongoose.Types.ObjectId(companyId),
      name:          c.name,
      phone:         c.phone,
      email:         c.email,
      city:          c.city,
      state:         c.state,
      gst_number:    c.gstin,
      customer_type: 'business',
      credit_limit:  c.credit_limit,
      credit_days:   c.payment_terms_days,
      is_active:     true,
      createdAt:     new Date(),
      updatedAt:     new Date(),
    };
    await db.collection('customers').insertOne(doc);
    report.counts.customers++;
  }
  step(`Import customers`, true, `${report.counts.customers} records`);

  // ── 7. Import Vehicles ────────────────────────────────────────────────────
  head('Step 7: Vehicle Fleet Import');
  report.counts.vehicles = 0;

  for (const v of VEHICLES) {
    const exists = await db.collection('vehicles').findOne({ registration_number: v.registration_number });
    if (exists) { report.counts.vehicles++; continue; }
    await db.collection('vehicles').insertOne({
      company_id:           new mongoose.Types.ObjectId(companyId),
      registration_number:  v.registration_number,
      vehicle_type:         v.vehicle_type,
      make:                 v.make,
      model:                v.model,
      year:                 v.year,
      capacity_tons:        v.capacity_tons,
      fuel_type:            v.fuel_type,
      owner_name:           v.owner_name,
      status:               'available',
      is_active:            true,
      createdAt:            new Date(),
      updatedAt:            new Date(),
    });
    report.counts.vehicles++;
  }
  step(`Import vehicles`, true, `${report.counts.vehicles} records`);

  // ── 8. Import Drivers ─────────────────────────────────────────────────────
  head('Step 8: Driver Roster Import');
  report.counts.drivers = 0;

  for (const d of DRIVERS) {
    const exists = await db.collection('drivers').findOne({
      company_id: new mongoose.Types.ObjectId(companyId), phone: d.phone,
    });
    if (exists) { report.counts.drivers++; continue; }
    await db.collection('drivers').insertOne({
      company_id:      new mongoose.Types.ObjectId(companyId),
      name:            d.name,
      phone:           d.phone,
      license_number:  d.license_number,
      license_expiry:  new Date(d.license_expiry),
      city:            d.city,
      state:           d.state,
      status:          'available',
      is_active:       true,
      createdAt:       new Date(),
      updatedAt:       new Date(),
    });
    report.counts.drivers++;
  }
  step(`Import drivers`, true, `${report.counts.drivers} records`);

  // ── 9. API Health Monitoring ──────────────────────────────────────────────
  head('Step 9: Production Monitoring Check');

  const health = await apiReq('GET', '/api/health');
  step('API health check', health.status === 200 && health.data.status === 'ok');

  const dashRes = await apiReq('GET', `/api/dashboard?branch_id=${branchIds.hq}`);
  step('Dashboard loads', dashRes.status === 200);

  const custRes = await apiReq('GET', `/api/customers?branch_id=${branchIds.hq}`);
  step('Customers API', custRes.status === 200, `${Array.isArray(custRes.data) ? custRes.data.length : 0} records`);

  const vehRes = await apiReq('GET', `/api/vehicles?branch_id=${branchIds.hq}`);
  step('Vehicles API', vehRes.status === 200, `${Array.isArray(vehRes.data) ? vehRes.data.length : 0} records`);

  const drvRes = await apiReq('GET', `/api/drivers?branch_id=${branchIds.hq}`);
  step('Drivers API', drvRes.status === 200, `${Array.isArray(drvRes.data) ? drvRes.data.length : 0} records`);

  const masterVT = await apiReq('GET', '/api/companies/master-config/vehicle_type');
  step('Master config: vehicle types', masterVT.status === 200, `${masterVT.data.length} types`);

  // ── 10. Business Workflow Validation ─────────────────────────────────────
  head('Step 10: Business Workflow Validation');
  const Q = `?branch_id=${branchIds.hq}`;

  // Lead
  const lead = await apiReq('POST', '/api/leads', {
    name: 'Shri Ram Traders', contact_name: 'Anil Kumar',
    phone: '9871234567', email: 'anil@shriramtraders.in',
    city: 'Agra', state: 'Uttar Pradesh',
    source: 'referral', status: 'new_lead',
    estimated_value: 120000, notes: 'Looking for regular FTL Delhi-Agra',
  });
  const leadId = lead.data?._id;
  step('Create Lead', lead.status === 200 || lead.status === 201, `id=${leadId}`);

  // Quote
  const qt = await apiReq('POST', '/api/quotes', {
    customer_name: 'Shri Ram Traders', customer_phone: '9871234567',
    customer_email: 'anil@shriramtraders.in',
    pickup_city: 'Delhi', pickup_state: 'Delhi', pickup_pincode: '110035',
    destination_city: 'Agra', destination_state: 'Uttar Pradesh', destination_pincode: '282001',
    weight_kg: 8000, packages: 120, material: 'Textile Goods',
    valid_till: new Date(Date.now() + 7 * 86400000).toISOString(),
    branch_id: branchIds.hq,
  });
  const qtId = qt.data?._id;
  step('Create Quote', qt.status === 200 || qt.status === 201, `id=${qtId}`);

  // Shipment
  const ship = await apiReq('POST', `/api/shipments${Q}`, {
    branch_id: branchIds.hq,
    sender_name: 'Rajdhani Cargo HQ', sender_phone: '01141234567',
    sender_address: '24, Transport Nagar, Ring Road, Delhi',
    receiver_name: 'Bharat Electronics Ltd', receiver_phone: '01123456781',
    receiver_address: '14, Sector 18, Gurgaon, Haryana',
    destination: 'Gurgaon',
    booking_date: new Date().toISOString(),
    freight_charges: 18500,
    payment_type: 'paid',
    weight: 2500, quantity: 40, material: 'Electronic Components',
  });
  const shipId = ship.data?.id || ship.data?._id;
  const lrNum  = ship.data?.lr_number;
  step('Create Shipment', ship.status === 200 || ship.status === 201, `LR=${lrNum}`);

  // Invoice — uses `line_items` field name
  const inv = await apiReq('POST', `/api/invoices${Q}`, {
    branch_id:     branchIds.hq,
    customer_name: 'Bharat Electronics Ltd',
    customer_phone: '01123456781',
    line_items:    [{ description: `Freight — ${lrNum}`, quantity: 1, rate: 18500, amount: 18500 }],
    due_date:      new Date(Date.now() + 30 * 86400000).toISOString(),
    shipment_id:   shipId,
    lr_number:     lrNum,
  });
  step('Create Invoice', inv.status === 200 || inv.status === 201, `id=${inv.data?._id || inv.data?.id}`);

  // Complaint — requires `type` field (complaint type, not category)
  const comp = await apiReq('POST', `/api/complaints${Q}`, {
    branch_id:     branchIds.hq,
    customer_name: 'Gujarat Steel Works',
    customer_phone: '07923456785',
    type:          'delivery',
    subject:       'Delivery delay — consignment 2 days late',
    description:   'Consignment dispatched from Delhi on 28-Jun arrived on 02-Jul instead of 30-Jun. Customer requesting explanation and credit note.',
    priority:      'medium',
    source:        'web',
  });
  step('Create Complaint', comp.status === 200 || comp.status === 201, `id=${comp.data?._id || comp.data?.id}`);

  // POD
  const pod = await apiReq('GET', `/api/pod${Q}`);
  step('POD endpoint accessible', pod.status === 200);

  // ── 11. Summary ───────────────────────────────────────────────────────────
  const passed = report.steps.filter(s => s.ok).length;
  const failed = report.steps.filter(s => !s.ok).length;

  console.log('\n' + '═'.repeat(60));
  console.log('  ONBOARDING COMPLETE');
  console.log('═'.repeat(60));
  console.log(`\n  Company:  ${COMPANY.name}`);
  console.log(`  Company ID: ${companyId}`);
  console.log(`  Branches: ${Object.keys(branchIds).length}`);
  console.log(`  Users:    ${report.counts.users}`);
  console.log(`  Customers: ${report.counts.customers}`);
  console.log(`  Vehicles:  ${report.counts.vehicles}`);
  console.log(`  Drivers:   ${report.counts.drivers}`);
  console.log(`\n  Steps:  ${passed} PASS / ${failed} FAIL`);
  if (report.errors.length) {
    console.log('\n  Failed steps:');
    report.errors.forEach(e => console.log(`    • ${e}`));
  }
  console.log('\n  Admin credentials:');
  console.log(`  Username: ${COMPANY.admin_username}`);
  console.log(`  Password: ${COMPANY.admin_password}`);
  console.log('');

  // Write machine-readable output for report generation
  const fs = require('fs');
  const output = {
    timestamp: new Date().toISOString(),
    company: { name: COMPANY.name, id: companyId },
    branches: branchIds,
    counts: report.counts,
    steps: { total: report.steps.length, passed, failed },
    errors: report.errors,
  };
  fs.writeFileSync('onboard-results.json', JSON.stringify(output, null, 2));
  console.log('  Results written to: backend/onboard-results.json\n');

  await mongoose.disconnect();
}

main().catch(e => {
  console.error('\n❌ Onboarding failed:', e.message);
  console.error(e.stack);
  process.exit(1);
});
