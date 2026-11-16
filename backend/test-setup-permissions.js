/**
 * test-setup-permissions.js
 * Comprehensive automated verification for LocalWheels Company Setup & Authorization
 */

const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const BASE_HOST = 'localhost';
const BASE_PORT = 5000;

function request(method, pathUrl, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = {};
    if (postData) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: pathUrl,
      method,
      headers,
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('='.repeat(80));
  console.log('LOCALWHEELS INITIAL SETUP PERMISSIONS & AUTHORIZATION VERIFICATION');
  console.log('Target API: http://localhost:5000');
  console.log('='.repeat(80));

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB directly for state verification.');

  const Company = mongoose.connection.collection('companies');
  const User = mongoose.connection.collection('users');

  let passed = 0;
  let failed = 0;
  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`  [PASS] ${name} ${details ? '-> ' + details : ''}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name} ${details ? '-> ' + details : ''}`);
      failed++;
    }
  }

  // Find the primary seeded company
  const primaryCompany = await Company.findOne({ is_active: true });
  assert('Primary company exists in DB', !!primaryCompany, `ID: ${primaryCompany?._id}`);

  // ── TEST 1: Legitimate Administrator Login & Setup Execution ───────────────
  console.log('\n--- 1. LEGITIMATE ADMINISTRATOR ACCESS ---');
  const adminLogin = await request('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
  assert('Admin login returns 200', adminLogin.status === 200);
  assert('Admin user role is admin', adminLogin.data?.user?.role === 'admin');
  const adminToken = adminLogin.data?.token;

  const adminGetMine = await request('GET', '/api/companies/mine', null, adminToken);
  assert('Admin GET /api/companies/mine succeeds', adminGetMine.status === 200, `Company: ${adminGetMine.data?.name}`);

  // Admin executes Step 1 (Company Info)
  const step1Payload = {
    setup_step: 1,
    name: 'Local Wheels Logistics India Pvt Ltd',
    phone: '040-99887766',
    email: 'info@localwheels.in',
    website: 'https://localwheels.in',
    address: 'Plot 100, Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    country: 'India',
  };
  const adminSaveStep1 = await request('PUT', '/api/companies/mine', step1Payload, adminToken);
  assert('Admin PUT /api/companies/mine (Step 1) returns 200 OK', adminSaveStep1.status === 200, `Step: ${adminSaveStep1.data?.setup_step}`);
  assert('Company name successfully updated', adminSaveStep1.data?.name === 'Local Wheels Logistics India Pvt Ltd');

  // Verify MongoDB directly
  const dbCompanyAfterStep1 = await Company.findOne({ _id: primaryCompany._id });
  assert('MongoDB company record matches Step 1 updates', dbCompanyAfterStep1.phone === '040-99887766' && dbCompanyAfterStep1.city === 'Hyderabad');
  assert('MongoDB setup_step is 1', dbCompanyAfterStep1.setup_step === 1);

  // Admin executes Step 2 (Business Details)
  const step2Payload = {
    setup_step: 2,
    gstin: '36AAACL1234A1Z5',
    pan: 'AAACL1234A',
    cin: 'U60200TG2026PTC123456',
    business_type: 'transport',
    financial_year_start: 'April',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  };
  const adminSaveStep2 = await request('PUT', '/api/companies/mine', step2Payload, adminToken);
  assert('Admin PUT /api/companies/mine (Step 2) returns 200 OK', adminSaveStep2.status === 200, `Step: ${adminSaveStep2.data?.setup_step}`);

  // Admin executes Step 4 (Communication Settings)
  const step4Payload = {
    smtp: { host: 'smtp.sendgrid.net', port: 587, user: 'apikey', from: 'no-reply@localwheels.in', enabled: true },
    sms: { provider: 'none', api_key: '', sender_id: '', enabled: false },
    whatsapp: { provider: 'none', api_key: '', phone_number: '', enabled: false },
  };
  const adminSaveStep4 = await request('PUT', '/api/companies/settings', step4Payload, adminToken);
  assert('Admin PUT /api/companies/settings (Step 4) returns 200 OK', adminSaveStep4.status === 200);

  // ── TEST 2: Unauthorized Users Must Be Rejected (403) ──────────────────────
  console.log('\n--- 2. UNAUTHORIZED USER REJECTION ---');
  const staffLogin = await request('POST', '/api/auth/login', { username: 'staff1', password: 'password123' });
  assert('Staff login returns 200', staffLogin.status === 200);
  assert('Staff user role is staff', staffLogin.data?.user?.role === 'staff');
  const staffToken = staffLogin.data?.token;

  // Staff attempts to update company info
  const staffAttempt = await request('PUT', '/api/companies/mine', { name: 'Hacked Company Name' }, staffToken);
  assert('Staff PUT /api/companies/mine returns 403 Forbidden', staffAttempt.status === 403, `Status: ${staffAttempt.status}`);
  assert('Staff response is Insufficient permissions', staffAttempt.data?.error === 'Insufficient permissions', `Error: ${staffAttempt.data?.error}`);

  // Verify company was not overwritten
  const dbCompanyAfterStaff = await Company.findOne({ _id: primaryCompany._id });
  assert('Company name was NOT modified by unauthorized staff', dbCompanyAfterStaff.name === 'Local Wheels Logistics India Pvt Ltd');

  // Staff attempts to update communication settings
  const staffSettingsAttempt = await request('PUT', '/api/companies/settings', { smtp: { host: 'malicious.com' } }, staffToken);
  assert('Staff PUT /api/companies/settings returns 403 Forbidden', staffSettingsAttempt.status === 403);
  assert('Staff settings response is Insufficient permissions', staffSettingsAttempt.data?.error === 'Insufficient permissions');

  // ── TEST 3: Role Naming Consistency (super_admin vs superadmin) ─────────────
  console.log('\n--- 3. ROLE NAMING CONSISTENCY ---');
  // Create a temporary user with role: 'super_admin'
  const testSuperAdmin = await User.insertOne({
    username: 'test_super_admin_role',
    role: 'super_admin',
    company_id: primaryCompany._id,
    is_active: true,
  });

  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'localwheels-dev-secret-key-change-in-production-123456';
  const superAdminToken = jwt.sign(
    { id: testSuperAdmin.insertedId.toString(), username: 'test_super_admin_role', role: 'super_admin', company_id: primaryCompany._id },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const superAdminPut = await request('PUT', '/api/companies/mine', { brand_name: 'LocalWheels Super' }, superAdminToken);
  assert('super_admin with underscore passes requireRole for admin endpoint', superAdminPut.status === 200, `Status: ${superAdminPut.status}`);

  const superAdminSettings = await request('PUT', '/api/companies/settings', { test: true }, superAdminToken);
  assert('super_admin with underscore passes requireRole on /settings', superAdminSettings.status === 200, `Status: ${superAdminSettings.status}`);

  await User.deleteOne({ _id: testSuperAdmin.insertedId });

  // ── TEST 4: Secure Administrator Requirement (No Auto-Promotion) ─────────────
  console.log('\n--- 4. SECURE ADMINISTRATOR REQUIREMENT (NO AUTO-PROMOTION) ---');
  // Create an uninitialized tenant company with 0 administrators
  const uninitCompany = await Company.insertOne({
    name: 'Uninitialized New Tenant Corp',
    setup_completed: false,
    setup_step: 0,
    is_active: true,
    createdAt: new Date(),
  });

  const firstUser = await User.insertOne({
    username: 'first_org_user',
    role: 'staff',
    company_id: uninitCompany.insertedId,
    is_active: true,
  });

  const firstUserToken = jwt.sign(
    { id: firstUser.insertedId.toString(), username: 'first_org_user', role: 'staff', company_id: uninitCompany.insertedId },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Staff user attempts to complete setup without administrator privileges — must be REJECTED (403)
  const firstUserSetup = await request('PUT', '/api/companies/mine', {
    setup_step: 1,
    name: 'Uninitialized New Tenant Corp - Configured',
    phone: '011-22334455',
  }, firstUserToken);

  assert('Staff user attempting setup is strictly REJECTED (403 Forbidden)', firstUserSetup.status === 403, `Status: ${firstUserSetup.status}`);
  assert('Staff user receives Insufficient permissions error', firstUserSetup.data?.error === 'Insufficient permissions');

  // Verify staff user was NOT automatically promoted to admin
  const unpromotedUser = await User.findOne({ _id: firstUser.insertedId });
  assert('Staff user was NOT auto-promoted to admin (role remains staff)', unpromotedUser.role === 'staff', `Role: ${unpromotedUser.role}`);

  // Now provision an authorized administrator for this company
  await User.updateOne({ _id: firstUser.insertedId }, { $set: { role: 'admin' } });
  const establishedAdminToken = jwt.sign(
    { id: firstUser.insertedId.toString(), username: 'first_org_user', role: 'admin', company_id: uninitCompany.insertedId },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const adminSetupSuccess = await request('PUT', '/api/companies/mine', {
    setup_step: 1,
    name: 'Uninitialized New Tenant Corp - Configured',
    phone: '011-22334455',
  }, establishedAdminToken);
  assert('Properly authorized administrator completes setup successfully (200 OK)', adminSetupSuccess.status === 200);

  // Now test that a separate staff user is REJECTED
  const secondUser = await User.insertOne({
    username: 'second_org_user',
    role: 'staff',
    company_id: uninitCompany.insertedId,
    is_active: true,
  });
  const secondUserToken = jwt.sign(
    { id: secondUser.insertedId.toString(), username: 'second_org_user', role: 'staff', company_id: uninitCompany.insertedId },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const secondUserAttempt = await request('PUT', '/api/companies/mine', { name: 'Unauthorized Modify' }, secondUserToken);
  assert('Second user is REJECTED (403) with Insufficient permissions', secondUserAttempt.status === 403, `Status: ${secondUserAttempt.status}`);

  // ── TEST 5: Already Initialized Company Protection ────────────────────────
  console.log('\n--- 5. ALREADY INITIALIZED COMPANY PROTECTION ---');
  // Mark uninitCompany as setup_completed: true
  await Company.updateOne({ _id: uninitCompany.insertedId }, { $set: { setup_completed: true } });

  // A non-admin user attempts to modify initialized company
  const postInitAttempt = await request('PUT', '/api/companies/mine', { name: 'Post-Init Modify' }, secondUserToken);
  assert('Non-admin modifying initialized company returns 403', postInitAttempt.status === 403, `Status: ${postInitAttempt.status}`);
  assert('Error is Insufficient permissions', postInitAttempt.data?.error === 'Insufficient permissions');

  // Clean up temporary tenant
  await Company.deleteOne({ _id: uninitCompany.insertedId });
  await User.deleteMany({ _id: { $in: [firstUser.insertedId, secondUser.insertedId] } });

  // ── TEST 6: Step Increments & Safe Retry ───────────────────────────────────
  console.log('\n--- 6. STEP INCREMENTS & SAFE RETRY ---');
  const stepRetry = await request('PUT', '/api/companies/mine', { setup_step: 3 }, adminToken);
  assert('Admin can retry and update setup_step to 3', stepRetry.status === 200 && stepRetry.data?.setup_step === 3);

  // Restore setup_step to 0 for primaryCompany
  await Company.updateOne({ _id: primaryCompany._id }, { $set: { setup_step: 0, setup_completed: false } });

  await mongoose.disconnect();

  console.log('='.repeat(80));
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(80));

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
