/**
 * LocalWheels — Production Onboarding Seed
 *
 * Usage:
 *   node src/db/seed-production.js
 *
 * Required env vars (in backend/.env or environment):
 *   MONGODB_URI          — production Atlas connection string
 *   SEED_COMPANY_NAME    — e.g. "Rajdhani Cargo Services Pvt Ltd"
 *   SEED_ADMIN_USERNAME  — e.g. "rajdhani_admin"
 *   SEED_ADMIN_EMAIL     — e.g. "admin@rajdhanicargoservices.com"
 *   SEED_ADMIN_PASSWORD  — strong password (min 12 chars)
 *
 * This script is IDEMPOTENT — safe to re-run; skips records that already exist.
 * It does NOT modify or delete existing data.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const Company = require('../models/Company');
const Branch  = require('../models/Branch');
const User    = require('../models/User');

// ── Validate environment ─────────────────────────────────────────────────────
const REQUIRED = ['MONGODB_URI', 'SEED_COMPANY_NAME', 'SEED_ADMIN_USERNAME', 'SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD'];
const missing  = REQUIRED.filter(k => !process.env[k] && !process.env[k.replace('MONGODB_URI', 'MONGO_URI')]);
if (missing.length) {
  console.error('❌ Missing required environment variables:', missing.join(', '));
  console.error('   Set them in backend/.env before running this script.');
  process.exit(1);
}

const MONGO           = process.env.MONGODB_URI || process.env.MONGO_URI;
const COMPANY_NAME    = process.env.SEED_COMPANY_NAME;
const ADMIN_USERNAME  = process.env.SEED_ADMIN_USERNAME;
const ADMIN_EMAIL     = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD  = process.env.SEED_ADMIN_PASSWORD;

if (ADMIN_PASSWORD.length < 12) {
  console.error('❌ SEED_ADMIN_PASSWORD must be at least 12 characters.');
  process.exit(1);
}

// ── Branch definitions (edit to match the customer) ──────────────────────────
// Each branch must have: branch_name, location, address
// Optional: phone, email, gstin
const BRANCH_DEFS = [
  { branch_name: 'HEAD OFFICE',    location: 'Hyderabad, Telangana',  address: 'Head Office Address' },
  { branch_name: 'BRANCH 1',       location: 'City, State',           address: 'Branch 1 Address' },
];

async function seed() {
  console.log(`\n🚀 LocalWheels Production Onboarding Seed`);
  console.log(`   Company  : ${COMPANY_NAME}`);
  console.log(`   Admin    : ${ADMIN_USERNAME} <${ADMIN_EMAIL}>`);
  console.log(`   MongoDB  : ${MONGO.replace(/:([^@]+)@/, ':***@')}\n`);

  await mongoose.connect(MONGO, { serverSelectionTimeoutMS: 10000 });
  console.log('✅ MongoDB connected\n');

  // ── Company ────────────────────────────────────────────────────────────────
  let company = await Company.findOne({ name: COMPANY_NAME });
  if (company) {
    console.log(`ℹ  Company already exists (${company._id}) — skipping creation`);
  } else {
    company = await Company.create({
      name: COMPANY_NAME,
      subscription_plan: 'enterprise',
      setup_completed: false,
      active: true,
    });
    console.log(`✅ Company created: ${company._id}`);
  }

  // ── Branches ───────────────────────────────────────────────────────────────
  const branches = [];
  for (const def of BRANCH_DEFS) {
    let branch = await Branch.findOne({ company_id: company._id, branch_name: def.branch_name });
    if (branch) {
      console.log(`ℹ  Branch already exists: ${def.branch_name} (${branch._id})`);
    } else {
      branch = await Branch.create({ company_id: company._id, active: true, ...def });
      console.log(`✅ Branch created: ${def.branch_name} (${branch._id})`);
    }
    branches.push(branch);
  }

  // ── Admin user ────────────────────────────────────────────────────────────
  const existing = await User.findOne({ username: ADMIN_USERNAME });
  if (existing) {
    console.log(`ℹ  User '${ADMIN_USERNAME}' already exists — skipping creation`);
  } else {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await User.create({
      company_id:   company._id,
      branch_ids:   branches.map(b => b._id),
      username:     ADMIN_USERNAME,
      email:        ADMIN_EMAIL,
      password:     hashedPassword,
      full_name:    'Company Administrator',
      role:         'admin',
      authProvider: 'local',
      active:       true,
    });
    console.log(`✅ Admin user created: ${ADMIN_USERNAME}`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n📋 Onboarding Summary');
  console.log(`   Company ID : ${company._id}`);
  console.log(`   Branches   : ${branches.length}`);
  branches.forEach(b => console.log(`     • ${b.branch_name} — ${b._id}`));
  console.log(`   Admin user : ${ADMIN_USERNAME}`);
  console.log(`   Login URL  : ${process.env.FRONTEND_URL || 'https://your-app.vercel.app'}/login`);
  console.log('\n⚠️  Store these IDs in your records before completing setup.\n');

  await mongoose.disconnect();
  console.log('✅ Seed complete. MongoDB disconnected.\n');
}

seed().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
