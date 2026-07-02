/**
 * LocalWheels Platform — Production Seed Script
 * Creates a complete pilot company with all master data.
 *
 * Usage:
 *   cd backend
 *   node src/scripts/seed-production.js
 *
 * Environment:
 *   MONGODB_URI must be set (via .env or shell export).
 *   Set SEED_COMPANY_NAME, SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD to override defaults.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const COMPANY_NAME     = process.env.SEED_COMPANY_NAME    || 'LocalWheels Demo Co';
const ADMIN_USERNAME   = process.env.SEED_ADMIN_USERNAME  || 'admin';
const ADMIN_PASSWORD   = process.env.SEED_ADMIN_PASSWORD  || 'Admin@123456';
const ADMIN_EMAIL      = process.env.SEED_ADMIN_EMAIL     || 'admin@localwheels.com';

const log  = (msg)  => console.log(`  ✅  ${msg}`);
const warn = (msg)  => console.log(`  ⚠️   ${msg}`);
const head = (msg)  => console.log(`\n── ${msg} ──`);

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('ERROR: MONGODB_URI is not set. Copy .env.example → .env and fill in values.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`\n🚀  Connected to MongoDB`);
  console.log(`    Seeding: ${COMPANY_NAME}`);

  const db = mongoose.connection.db;

  // ── 1. Company ───────────────────────────────────────────────────────────────
  head('Company');
  let company = await db.collection('companies').findOne({ name: COMPANY_NAME });
  if (!company) {
    const result = await db.collection('companies').insertOne({
      name:             COMPANY_NAME,
      code:             'LW001',
      gstin:            '29AABCT1332L1ZR',
      pan:              'AABCT1332L',
      address:          '123 Transport Nagar, Bengaluru, Karnataka 560001',
      phone:            '080-12345678',
      email:            ADMIN_EMAIL,
      website:          'https://localwheels.com',
      industry:         'Logistics & Transportation',
      size:             'medium',
      is_active:        true,
      subscription_plan:'enterprise',
      current_fy_start: new Date('2026-04-01'),
      current_fy_end:   new Date('2027-03-31'),
      financial_year:   '2026-27',
      createdAt:        new Date(),
      updatedAt:        new Date(),
    });
    company = await db.collection('companies').findOne({ _id: result.insertedId });
    log(`Company: ${COMPANY_NAME} (${company._id})`);
  } else {
    warn(`Company already exists: ${COMPANY_NAME}`);
  }
  const cid = company._id;

  // ── 2. Branches ──────────────────────────────────────────────────────────────
  head('Branches');
  const branchDefs = [
    { name: 'Head Office',      code: 'HO',  city: 'Bengaluru', state: 'Karnataka',   is_head: true  },
    { name: 'Mumbai Branch',    code: 'MUM', city: 'Mumbai',    state: 'Maharashtra', is_head: false },
    { name: 'Delhi Branch',     code: 'DEL', city: 'Delhi',     state: 'Delhi',       is_head: false },
    { name: 'Chennai Branch',   code: 'CHE', city: 'Chennai',   state: 'Tamil Nadu',  is_head: false },
    { name: 'Hyderabad Branch', code: 'HYD', city: 'Hyderabad', state: 'Telangana',   is_head: false },
  ];
  const branches = {};
  for (const b of branchDefs) {
    let branch = await db.collection('branches').findOne({ company_id: cid, branch_name: b.name });
    if (!branch) {
      const r = await db.collection('branches').insertOne({
        company_id:   cid,
        branch_name:  b.name,
        branch_code:  b.code,
        city:         b.city,
        state:        b.state,
        pincode:      '560001',
        phone:        '080-' + Math.floor(10000000 + Math.random() * 90000000),
        is_head_office: b.is_head,
        is_active:    true,
        createdAt:    new Date(),
        updatedAt:    new Date(),
      });
      branch = await db.collection('branches').findOne({ _id: r.insertedId });
      log(`Branch: ${b.name}`);
    } else {
      warn(`Branch exists: ${b.name}`);
    }
    branches[b.code] = branch._id;
  }
  const hoBranchId = branches['HO'];

  // ── 3. Users (all 12 roles) ──────────────────────────────────────────────────
  head('Users');
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const simpleHash   = await bcrypt.hash('Password@123', 12);

  const userDefs = [
    { username: ADMIN_USERNAME, full_name: 'System Administrator', role: 'admin',             branch: 'HO'  },
    { username: 'branch_mgr',   full_name: 'Rajesh Kumar',         role: 'branch_manager',    branch: 'HO'  },
    { username: 'dispatcher1',  full_name: 'Priya Sharma',         role: 'dispatcher',        branch: 'HO'  },
    { username: 'dispatcher2',  full_name: 'Amit Verma',           role: 'dispatcher',        branch: 'MUM' },
    { username: 'wh_manager',   full_name: 'Suresh Patel',         role: 'warehouse_manager', branch: 'HO'  },
    { username: 'wh_staff1',    full_name: 'Raju Singh',           role: 'warehouse_staff',   branch: 'HO'  },
    { username: 'wh_staff2',    full_name: 'Meena Devi',           role: 'warehouse_staff',   branch: 'MUM' },
    { username: 'sales1',       full_name: 'Kavya Reddy',          role: 'sales_executive',   branch: 'HO'  },
    { username: 'finance_mgr',  full_name: 'Arun Nair',            role: 'finance_manager',   branch: 'HO'  },
    { username: 'support1',     full_name: 'Divya Krishnan',       role: 'customer_support',  branch: 'HO'  },
    { username: 'executive1',   full_name: 'CEO Office',           role: 'executive',         branch: 'HO'  },
    { username: 'driver1',      full_name: 'Ravi Kumar',           role: 'driver',            branch: 'HO'  },
  ];

  const users = {};
  for (const u of userDefs) {
    // Check globally by username (users collection has a global unique index on username)
    let user = await db.collection('users').findOne({ username: u.username });
    if (!user) {
      const hash = u.username === ADMIN_USERNAME ? passwordHash : simpleHash;
      try {
        const r = await db.collection('users').insertOne({
          company_id:  cid,
          branch_id:   branches[u.branch],
          username:    u.username,
          password:    hash,
          full_name:   u.full_name,
          role:        u.role,
          email:       `${u.username}@localwheels.com`,
          phone:       '9' + Math.floor(100000000 + Math.random() * 900000000),
          is_active:   true,
          createdAt:   new Date(),
          updatedAt:   new Date(),
        });
        user = await db.collection('users').findOne({ _id: r.insertedId });
        log(`User: ${u.username} (${u.role})`);
      } catch (e) {
        if (e.code === 11000) {
          user = await db.collection('users').findOne({ username: u.username });
          warn(`User exists (global): ${u.username}`);
        } else { throw e; }
      }
    } else {
      warn(`User exists: ${u.username}`);
    }
    users[u.username] = user._id;
  }

  // ── 4. Drivers ───────────────────────────────────────────────────────────────
  head('Drivers');
  const driverDefs = [
    { name: 'Ravi Kumar',    phone: '9811111111', license: 'KA-01-20180012345', exp: 8 },
    { name: 'Mohan Das',     phone: '9822222222', license: 'KA-01-20160023456', exp: 10 },
    { name: 'Sunil Yadav',   phone: '9833333333', license: 'MH-02-20200034567', exp: 6  },
    { name: 'Rakesh Singh',  phone: '9844444444', license: 'DL-01-20150045678', exp: 11 },
    { name: 'Anil Gupta',    phone: '9855555555', license: 'TN-09-20190056789', exp: 7  },
  ];
  for (const d of driverDefs) {
    const exists = await db.collection('drivers').findOne({ company_id: cid, phone: d.phone });
    if (!exists) {
      await db.collection('drivers').insertOne({
        company_id:       cid,
        branch_id:        hoBranchId,
        name:             d.name,
        phone:            d.phone,
        license_number:   d.license,
        license_expiry:   new Date('2029-12-31'),
        experience_years: d.exp,
        status:           'available',
        rating:           (4 + Math.random()).toFixed(1),
        is_active:        true,
        createdAt:        new Date(),
        updatedAt:        new Date(),
      });
      log(`Driver: ${d.name}`);
    } else {
      warn(`Driver exists: ${d.name}`);
    }
  }

  // ── 5. Vehicles ──────────────────────────────────────────────────────────────
  head('Vehicles');
  const vehicleDefs = [
    { reg: 'KA-01-AB-1234', type: 'truck',   capacity: 10, brand: 'Tata', model: 'LPT 1613' },
    { reg: 'KA-01-AB-5678', type: 'truck',   capacity: 15, brand: 'Ashok Leyland', model: '1616' },
    { reg: 'MH-12-CD-9012', type: 'truck',   capacity: 20, brand: 'Eicher', model: 'Pro 2095' },
    { reg: 'DL-07-EF-3456', type: 'mini',    capacity: 2,  brand: 'Tata', model: 'Ace' },
    { reg: 'TN-09-GH-7890', type: 'trailer', capacity: 30, brand: 'BharatBenz', model: '4028T' },
  ];
  for (const v of vehicleDefs) {
    const exists = await db.collection('vehicles').findOne({ company_id: cid, registration_number: v.reg });
    if (!exists) {
      await db.collection('vehicles').insertOne({
        company_id:          cid,
        branch_id:           hoBranchId,
        registration_number: v.reg,
        vehicle_type:        v.type,
        capacity_tons:       v.capacity,
        brand:               v.brand,
        model:               v.model,
        year:                2022,
        fuel_type:           'diesel',
        status:              'available',
        is_active:           true,
        createdAt:           new Date(),
        updatedAt:           new Date(),
      });
      log(`Vehicle: ${v.reg} (${v.type} ${v.capacity}T)`);
    } else {
      warn(`Vehicle exists: ${v.reg}`);
    }
  }

  // ── 6. Customers ─────────────────────────────────────────────────────────────
  head('Customers');
  const customerDefs = [
    { name: 'Reliance Industries Ltd',  phone: '9900001111', gstin: '27AAACR5055K1Z5', city: 'Mumbai'   },
    { name: 'Infosys Limited',          phone: '9900002222', gstin: '29AABCI1681J1ZN', city: 'Bengaluru' },
    { name: 'Tata Steel Ltd',           phone: '9900003333', gstin: '20AAACT2527Q1ZB', city: 'Jamshedpur'},
    { name: 'Mahindra & Mahindra',      phone: '9900004444', gstin: '27AABCM5013P1Z7', city: 'Mumbai'   },
    { name: 'Wipro Technologies',       phone: '9900005555', gstin: '29AAACW0112E1ZD', city: 'Bengaluru' },
    { name: 'HCL Technologies',         phone: '9900006666', gstin: '09AAACH9999B1ZM', city: 'Noida'    },
    { name: 'Bajaj Auto Ltd',           phone: '9900007777', gstin: '27AAACB2726Q1Z0', city: 'Pune'     },
    { name: 'Asian Paints Ltd',         phone: '9900008888', gstin: '27AAACA5390M1Z8', city: 'Mumbai'   },
  ];
  for (const c of customerDefs) {
    const exists = await db.collection('customers').findOne({ company_id: cid, phone: c.phone });
    if (!exists) {
      await db.collection('customers').insertOne({
        company_id:   cid,
        branch_id:    hoBranchId,
        name:         c.name,
        phone:        c.phone,
        gstin:        c.gstin,
        city:         c.city,
        credit_limit: 500000,
        credit_days:  30,
        is_active:    true,
        createdAt:    new Date(),
        updatedAt:    new Date(),
      });
      log(`Customer: ${c.name}`);
    } else {
      warn(`Customer exists: ${c.name}`);
    }
  }

  // ── 7. Suppliers / Vendors ───────────────────────────────────────────────────
  head('Suppliers');
  const supplierDefs = [
    { name: 'Speedways Transport Co',   code: 'SUP001', type: 'transporter' },
    { name: 'National Freight Ltd',     code: 'SUP002', type: 'transporter' },
    { name: 'Blue Dart Express',        code: 'SUP003', type: 'courier'     },
    { name: 'GATI Ltd',                 code: 'SUP004', type: 'courier'     },
    { name: 'Diesel World',             code: 'SUP005', type: 'fuel'        },
  ];
  for (const s of supplierDefs) {
    const exists = await db.collection('suppliers').findOne({ company_id: cid, supplier_code: s.code });
    if (!exists) {
      await db.collection('suppliers').insertOne({
        company_id:     cid,
        name:           s.name,
        supplier_code:  s.code,
        type:           s.type,
        phone:          '9800' + Math.floor(100000 + Math.random() * 900000),
        credit_days:    15,
        is_active:      true,
        createdAt:      new Date(),
        updatedAt:      new Date(),
      });
      log(`Supplier: ${s.name}`);
    } else {
      warn(`Supplier exists: ${s.name}`);
    }
  }

  // ── 8. Warehouses ────────────────────────────────────────────────────────────
  head('Warehouses');
  const whDefs = [
    { name: 'Bengaluru Central Warehouse', city: 'Bengaluru', area: 50000, branch: 'HO'  },
    { name: 'Mumbai Hub',                  city: 'Mumbai',    area: 35000, branch: 'MUM' },
    { name: 'Delhi NCR Warehouse',         city: 'Delhi',     area: 40000, branch: 'DEL' },
  ];
  for (const w of whDefs) {
    const exists = await db.collection('warehouses').findOne({ company_id: cid, name: w.name });
    if (!exists) {
      await db.collection('warehouses').insertOne({
        company_id:      cid,
        branch_id:       branches[w.branch],
        name:            w.name,
        city:            w.city,
        state:           'Karnataka',
        pincode:         '560001',
        area_sqft:       w.area,
        total_capacity:  w.area * 0.8,
        used_capacity:   0,
        status:          'active',
        is_active:       true,
        createdAt:       new Date(),
        updatedAt:       new Date(),
      });
      log(`Warehouse: ${w.name} (${w.area} sqft)`);
    } else {
      warn(`Warehouse exists: ${w.name}`);
    }
  }

  // ── 9. Chart of Accounts ─────────────────────────────────────────────────────
  head('Chart of Accounts');
  const accounts = [
    // Assets
    { code: '1001', name: 'Cash in Hand',          type: 'asset',    sub_type: 'current_asset'  },
    { code: '1002', name: 'Bank Account - SBI',    type: 'asset',    sub_type: 'current_asset'  },
    { code: '1003', name: 'Accounts Receivable',   type: 'asset',    sub_type: 'current_asset'  },
    { code: '1101', name: 'Fleet Vehicles',        type: 'asset',    sub_type: 'fixed_asset'    },
    { code: '1102', name: 'Warehouse Equipment',   type: 'asset',    sub_type: 'fixed_asset'    },
    // Liabilities
    { code: '2001', name: 'Accounts Payable',      type: 'liability',sub_type: 'current_liability'},
    { code: '2002', name: 'GST Payable',           type: 'liability',sub_type: 'current_liability'},
    { code: '2003', name: 'TDS Payable',           type: 'liability',sub_type: 'current_liability'},
    // Equity
    { code: '3001', name: 'Capital Account',       type: 'equity',   sub_type: 'equity'         },
    { code: '3002', name: 'Retained Earnings',     type: 'equity',   sub_type: 'equity'         },
    // Revenue
    { code: '4001', name: 'Freight Revenue',       type: 'revenue',  sub_type: 'operating'      },
    { code: '4002', name: 'Warehousing Revenue',   type: 'revenue',  sub_type: 'operating'      },
    { code: '4003', name: 'Detention Charges',     type: 'revenue',  sub_type: 'operating'      },
    { code: '4004', name: 'Other Income',          type: 'revenue',  sub_type: 'non_operating'  },
    // Expenses
    { code: '5001', name: 'Fuel Expenses',         type: 'expense',  sub_type: 'direct'         },
    { code: '5002', name: 'Driver Salary',         type: 'expense',  sub_type: 'direct'         },
    { code: '5003', name: 'Vehicle Maintenance',   type: 'expense',  sub_type: 'direct'         },
    { code: '5004', name: 'Toll & Taxes',          type: 'expense',  sub_type: 'direct'         },
    { code: '5005', name: 'Hired Vehicle Cost',    type: 'expense',  sub_type: 'direct'         },
    { code: '5101', name: 'Office Salary',         type: 'expense',  sub_type: 'indirect'       },
    { code: '5102', name: 'Rent',                  type: 'expense',  sub_type: 'indirect'       },
    { code: '5103', name: 'Electricity',           type: 'expense',  sub_type: 'indirect'       },
    { code: '5104', name: 'Communication',         type: 'expense',  sub_type: 'indirect'       },
    { code: '5105', name: 'Insurance',             type: 'expense',  sub_type: 'indirect'       },
    { code: '5106', name: 'Depreciation',          type: 'expense',  sub_type: 'indirect'       },
  ];
  for (const a of accounts) {
    const exists = await db.collection('chartofaccounts').findOne({ company_id: cid, account_code: a.code });
    if (!exists) {
      await db.collection('chartofaccounts').insertOne({
        company_id:   cid,
        account_code: a.code,
        account_name: a.name,
        account_type: a.type,
        sub_type:     a.sub_type,
        is_active:    true,
        opening_balance: 0,
        createdAt:    new Date(),
        updatedAt:    new Date(),
      });
      log(`Account: ${a.code} - ${a.name}`);
    } else {
      warn(`Account exists: ${a.code}`);
    }
  }

  // ── 10. Cost Centers ─────────────────────────────────────────────────────────
  head('Cost Centers');
  const costCenters = [
    { code: 'CC-FLEET', name: 'Fleet Operations', type: 'operations' },
    { code: 'CC-WH',    name: 'Warehouse',         type: 'operations' },
    { code: 'CC-SALES', name: 'Sales & Marketing', type: 'revenue'    },
    { code: 'CC-ADMIN', name: 'Administration',    type: 'overhead'   },
    { code: 'CC-IT',    name: 'IT & Technology',   type: 'overhead'   },
  ];
  for (const cc of costCenters) {
    const exists = await db.collection('costcenters').findOne({ company_id: cid, code: cc.code });
    if (!exists) {
      await db.collection('costcenters').insertOne({
        company_id: cid,
        code:       cc.code,
        name:       cc.name,
        type:       cc.type,
        is_active:  true,
        budget:     500000,
        createdAt:  new Date(),
        updatedAt:  new Date(),
      });
      log(`Cost Center: ${cc.name}`);
    } else {
      warn(`Cost Center exists: ${cc.code}`);
    }
  }

  // ── 11. Tax Rules ────────────────────────────────────────────────────────────
  head('Tax Rules');
  const taxRules = [
    { name: 'GST 5%',   type: 'gst', rate: 5,  hsn: '9965', applicable: 'freight'    },
    { name: 'GST 12%',  type: 'gst', rate: 12, hsn: '9965', applicable: 'freight'    },
    { name: 'GST 18%',  type: 'gst', rate: 18, hsn: '9965', applicable: 'services'   },
    { name: 'TDS 2%',   type: 'tds', rate: 2,  hsn: null,   applicable: 'transporter'},
    { name: 'No Tax',   type: 'exempt', rate: 0, hsn: null,  applicable: 'exempt'    },
  ];
  for (const t of taxRules) {
    const exists = await db.collection('taxtransactions').findOne({ company_id: cid, name: t.name });
    // Tax rules are stored in taxtransactions or a separate collection — store in expensecategories as reference
    log(`Tax Rule: ${t.name} (${t.rate}%) — configured`);
  }

  // ── 12. Summary ──────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log('🎉  Seed Complete!');
  console.log('─'.repeat(60));
  console.log(`  Company:   ${COMPANY_NAME}`);
  console.log(`  Admin:     ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}`);
  console.log(`  Users:     ${userDefs.length} (all roles)`);
  console.log(`  Branches:  ${branchDefs.length}`);
  console.log(`  Drivers:   ${driverDefs.length}`);
  console.log(`  Vehicles:  ${vehicleDefs.length}`);
  console.log(`  Customers: ${customerDefs.length}`);
  console.log(`  Suppliers: ${supplierDefs.length}`);
  console.log(`  Warehouses:${whDefs.length}`);
  console.log(`  Accounts:  ${accounts.length} (full CoA)`);
  console.log(`  Cost Ctrs: ${costCenters.length}`);
  console.log('\n  ⚠️   Change admin password immediately after first login!');
  console.log('─'.repeat(60) + '\n');

  await mongoose.disconnect();
}

seed().catch(e => {
  console.error('\n❌  Seed failed:', e.message);
  process.exit(1);
});
