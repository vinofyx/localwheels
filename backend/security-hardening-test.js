/**
 * LOCALWHEELS ENTERPRISE SECURITY AUDIT & HARDENING VERIFICATION TEST SUITE
 * 
 * Verifies all security requirements:
 * 1. Authentication Security (algorithm pinning, inactive account rejection, token revocation on logout)
 * 2. Super Admin & First Admin Security (atomic bootstrap, secret requirement, permanent lock, no auto-promotion)
 * 3. RBAC & Escalation Prevention (default deny, role normalization, self-promotion block, admin/superadmin separation)
 * 4. Multi-Tenant Isolation & IDOR Protection (cross-company rejection across all core models, mass-assignment immunity)
 * 5. Branch-Level Access Control (cross-branch isolation, unauthorized transfer block, transfer audit logging)
 * 6. Audit Logging Verification (recording privileged events)
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'localwheels-dev-secret-key-change-in-production-123456';
const BOOTSTRAP_SECRET = process.env.BOOTSTRAP_SECRET || 'localwheels-secure-bootstrap-key-9f8e7d6c5b4a3210';

let testPassCount = 0;
let testFailCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    testPassCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    testFailCount++;
  }
}

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, ok: res.ok, body, headers: res.headers };
}

async function run() {
  console.log('='.repeat(80));
  console.log('LOCALWHEELS ENTERPRISE SECURITY HARDENING TEST SUITE');
  console.log(`Target API: ${BASE_URL}`);
  console.log('='.repeat(80));

  // Connect to DB directly for state setup and assertions
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔗 Connected to MongoDB.');

  const User = require('./src/models/User');
  const Company = require('./src/models/Company');
  const Branch = require('./src/models/Branch');
  const Shipment = require('./src/models/Shipment');
  const Customer = require('./src/models/Customer');
  const Invoice = require('./src/models/Invoice');
  const Payment = require('./src/models/Payment');
  const POD = require('./src/models/POD');
  const BootstrapLock = require('./src/models/BootstrapLock');
  const AuditLog = require('./src/models/AuditLog');

  // Find or create primary company
  let primaryCompany = await Company.findOne({ is_active: true }).sort({ createdAt: 1 });
  if (!primaryCompany) {
    primaryCompany = await Company.create({
      name: 'Primary Logistics Corp',
      is_active: true,
      setup_completed: true,
    });
  }

  // Find or create primary admin
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  let primaryAdmin = await User.findOne({ username: 'sec_test_admin' });
  if (!primaryAdmin) {
    primaryAdmin = await User.create({
      username: 'sec_test_admin',
      password: adminPasswordHash,
      role: 'admin',
      company_id: primaryCompany._id,
      is_active: true,
    });
  } else {
    primaryAdmin.password = adminPasswordHash;
    primaryAdmin.role = 'admin';
    primaryAdmin.is_active = true;
    await primaryAdmin.save();
  }

  // Find or create primary staff
  const staffPasswordHash = await bcrypt.hash('Staff@123', 10);
  let primaryStaff = await User.findOne({ username: 'sec_test_staff' });
  if (!primaryStaff) {
    primaryStaff = await User.create({
      username: 'sec_test_staff',
      password: staffPasswordHash,
      role: 'staff',
      company_id: primaryCompany._id,
      is_active: true,
    });
  } else {
    primaryStaff.password = staffPasswordHash;
    primaryStaff.role = 'staff';
    primaryStaff.is_active = true;
    await primaryStaff.save();
  }

  // Find or create branches for primary company
  let branchA = await Branch.findOne({ company_id: primaryCompany._id, branch_name: 'BRANCH-A' });
  if (!branchA) {
    branchA = await Branch.create({ company_id: primaryCompany._id, branch_name: 'BRANCH-A', location: 'Location A', is_active: true });
  }
  let branchB = await Branch.findOne({ company_id: primaryCompany._id, branch_name: 'BRANCH-B' });
  if (!branchB) {
    branchB = await Branch.create({ company_id: primaryCompany._id, branch_name: 'BRANCH-B', location: 'Location B', is_active: true });
  }

  // Assign staff to branchA
  primaryStaff.branch_ids = [branchA._id];
  await primaryStaff.save();

  console.log('\n--- 1. AUTHENTICATION SECURITY & TOKEN VERIFICATION ---');

  // Test 1.1: Valid login
  const loginRes = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'sec_test_admin', password: 'Admin@123' },
  });
  assert(loginRes.status === 200 && loginRes.body.token, 'Legitimate login returns 200 with JWT');
  const adminToken = loginRes.body.token;

  // Test 1.2: Invalid password
  const badPassRes = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'sec_test_admin', password: 'WrongPassword' },
  });
  assert(badPassRes.status === 401, 'Invalid password correctly returns 401 Unauthorized');

  // Test 1.3: Inactive/Deactivated user login rejected
  const inactiveUser = await User.create({
    username: 'sec_test_deactivated',
    password: await bcrypt.hash('Deact@123', 10),
    role: 'staff',
    company_id: primaryCompany._id,
    is_active: false,
  });
  const deactLoginRes = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'sec_test_deactivated', password: 'Deact@123' },
  });
  assert(deactLoginRes.status === 403, 'Deactivated user login returns 403 Account Deactivated');
  await User.deleteOne({ _id: inactiveUser._id });

  // Test 1.4: Reject token with tampered signature
  const tamperedToken = adminToken.slice(0, -6) + 'abcdef';
  const tamperedRes = await api('/api/auth/me', {
    headers: { Authorization: `Bearer ${tamperedToken}` },
  });
  assert(tamperedRes.status === 401, 'Tampered JWT signature is rejected with 401');

  // Test 1.5: Reject token with algorithm "none"
  const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const nonePayload = Buffer.from(JSON.stringify({ id: primaryAdmin._id.toString(), role: 'admin' })).toString('base64url');
  const noneToken = `${noneHeader}.${nonePayload}.`;
  const noneRes = await api('/api/auth/me', {
    headers: { Authorization: `Bearer ${noneToken}` },
  });
  assert(noneRes.status === 401, 'Token with alg="none" is strictly rejected with 401');

  // Test 1.6: Server-side token invalidation on logout
  const logoutRes = await api('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(logoutRes.status === 200 && logoutRes.body.success, 'POST /api/auth/logout returns 200 OK');

  // Delay 100ms to allow timestamp separation
  await new Promise(r => setTimeout(r, 100));

  const postLogoutRes = await api('/api/auth/me', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(postLogoutRes.status === 401, 'Invalidated token rejected with 401 after logout');

  // Test 1.7: Fresh login after logout works
  const reloginRes = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'sec_test_admin', password: 'Admin@123' },
  });
  assert(reloginRes.status === 200 && reloginRes.body.token, 'Re-login generates fresh valid token');
  const validAdminToken = reloginRes.body.token;

  // Staff login
  const staffLoginRes = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'sec_test_staff', password: 'Staff@123' },
  });
  assert(staffLoginRes.status === 200 && staffLoginRes.body.token, 'Staff login succeeds');
  const validStaffToken = staffLoginRes.body.token;

  console.log('\n--- 2. SUPER ADMIN & FIRST ADMIN SECURITY (BOOTSTRAP) ---');

  // Reset bootstrap lock and test bootstrap flow
  await BootstrapLock.deleteMany({});
  await User.deleteMany({ role: { $in: ['superadmin', 'super_admin'] } });

  // Test 2.1: Check bootstrap status
  const statusRes = await api('/api/auth/bootstrap-status');
  assert(statusRes.status === 200 && statusRes.body.allowed === true, 'Initial bootstrap status is allowed: true');

  // Test 2.2: Reject bootstrap with invalid secret
  const badSecretRes = await api('/api/auth/bootstrap-superadmin', {
    method: 'POST',
    body: {
      bootstrap_secret: 'incorrect-secret-key-1234',
      username: 'new_superadmin',
      password: 'SuperAdminPassword#2026',
    },
  });
  assert(badSecretRes.status === 403, 'Bootstrap with invalid secret returns 403 Forbidden');

  // Test 2.3: Successful atomic bootstrap
  const goodBootstrapRes = await api('/api/auth/bootstrap-superadmin', {
    method: 'POST',
    body: {
      bootstrap_secret: BOOTSTRAP_SECRET,
      username: 'bootstrapped_superadmin',
      password: 'SuperAdminPassword#2026',
      email: 'superadmin@localwheels.com',
      full_name: 'Platform Super Administrator',
    },
  });
  assert(goodBootstrapRes.status === 201 && goodBootstrapRes.body.success, 'Bootstrap with correct secret provisions superadmin (201)');

  // Test 2.4: Permanent lock: second bootstrap attempt MUST be rejected
  const replayBootstrapRes = await api('/api/auth/bootstrap-superadmin', {
    method: 'POST',
    body: {
      bootstrap_secret: BOOTSTRAP_SECRET,
      username: 'another_superadmin',
      password: 'SuperAdminPassword#2026',
    },
  });
  assert(replayBootstrapRes.status === 409, 'Subsequent bootstrap attempt is permanently rejected (409 Conflict)');

  // Test 2.5: Verify bootstrap logged in AuditLog
  const bootstrapLog = await AuditLog.findOne({ event_type: 'admin_bootstrap' });
  assert(bootstrapLog && bootstrapLog.target_username === 'bootstrapped_superadmin', 'Bootstrap event recorded in AuditLog');

  // Test 2.6: Staff user CANNOT become admin through setup API (auto-promotion removed)
  const staffSetupAttempt = await api('/api/companies/mine', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${validStaffToken}` },
    body: { name: 'Compromised Name' },
  });
  assert(staffSetupAttempt.status === 403, 'Staff user calling PUT /api/companies/mine is strictly rejected with 403');
  const staffCheck = await User.findById(primaryStaff._id);
  assert(staffCheck.role === 'staff', 'Staff user was NOT auto-promoted to admin');

  console.log('\n--- 3. ROLE-BASED ACCESS CONTROL (RBAC) & PRIVILEGE ESCALATION ---');

  // Test 3.1: Staff blocked from admin endpoints
  const staffUserListRes = await api('/api/users', {
    headers: { Authorization: `Bearer ${validStaffToken}` },
  });
  assert(staffUserListRes.status === 403, 'Staff user blocked from GET /api/users (403)');

  // Test 3.2: Company admin cannot create a superadmin
  const adminCreateSuperadminRes = await api('/api/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${validAdminToken}` },
    body: {
      username: 'rogue_superadmin',
      password: 'Password123!',
      role: 'superadmin',
    },
  });
  assert(adminCreateSuperadminRes.status === 403, 'Company admin blocked from creating superadmin user (403)');

  // Test 3.3: Self-promotion prevention: user cannot change their own role
  const selfPromoteRes = await api(`/api/users/${primaryAdmin._id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${validAdminToken}` },
    body: { role: 'superadmin' },
  });
  assert(selfPromoteRes.status === 403, 'Admin self-promotion to superadmin blocked (403)');

  // Test 3.4: Users cannot change their own branch assignment
  const selfBranchRes = await api(`/api/users/${primaryAdmin._id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${validAdminToken}` },
    body: { branch_ids: [branchB._id.toString()] },
  });
  assert(selfBranchRes.status === 403, 'User changing own branch assignment blocked (403)');

  // Test 3.5: Cannot deactivate own account
  const selfDeactRes = await api(`/api/users/${primaryAdmin._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${validAdminToken}` },
  });
  assert(selfDeactRes.status === 400, 'Deleting/deactivating own account blocked (400)');

  // Test 3.6: Non-superadmin cannot deactivate superadmin
  const superadminUser = await User.findOne({ username: 'bootstrapped_superadmin' });
  const adminDeleteSuperRes = await api(`/api/users/${superadminUser._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${validAdminToken}` },
  });
  assert(adminDeleteSuperRes.status === 403, 'Company admin deleting superadmin blocked (403)');

  console.log('\n--- 4. MULTI-TENANT DATA ISOLATION & IDOR PROTECTION ---');

  // Create isolated second tenant
  const tenantB = await Company.create({
    name: 'Tenant B Logistics Ltd',
    is_active: true,
    setup_completed: true,
  });
  const tenantBBranch = await Branch.create({
    company_id: tenantB._id,
    branch_name: 'TENANT-B-HUB',
    location: 'Tenant B City',
    is_active: true,
  });
  const tenantBCustomer = await Customer.create({
    company_id: tenantB._id,
    name: 'Tenant B Exclusive Client',
    phone: '8888777701',
  });
  const tenantBShipment = await Shipment.create({
    company_id: tenantB._id,
    branch_id: tenantBBranch._id,
    lr_number: 'LWTENANTB001',
    sender_name: 'Sender B',
    receiver_name: 'Receiver B',
    destination: 'City B',
    freight_amount: 5000,
  });
  const tenantBPod = await POD.create({
    company_id: tenantB._id,
    shipment_id: tenantBShipment._id,
    status: 'uploaded',
  });
  const tenantBPayment = await Payment.create({
    company_id: tenantB._id,
    branch_id: tenantBBranch._id,
    shipment_id: tenantBShipment._id,
    amount: 5000,
    status: 'pending',
  });
  const tenantBInvoice = await Invoice.create({
    company_id: tenantB._id,
    branch_id: tenantBBranch._id,
    invoice_number: 'INVB-001',
    customer_name: 'Tenant B Exclusive Client',
    line_items: [{ description: 'Freight', amount: 5000 }],
    subtotal: 5000,
    total: 5900,
  });

  // Test 4.1: IDOR on Shipment read
  const crossShipmentRes = await api(`/api/shipments/${tenantBShipment._id}`, {
    headers: { Authorization: `Bearer ${validAdminToken}` },
  });
  assert(crossShipmentRes.status === 404, 'Cross-tenant shipment read returns 404 (IDOR prevented)');

  // Test 4.2: IDOR on Customer read
  const crossCustomerRes = await api(`/api/customers/${tenantBCustomer._id}`, {
    headers: { Authorization: `Bearer ${validAdminToken}` },
  });
  assert(crossCustomerRes.status === 404, 'Cross-tenant customer read returns 404 (IDOR prevented)');

  // Test 4.3: IDOR on Customer update
  const crossCustomerUpdateRes = await api(`/api/customers/${tenantBCustomer._id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${validAdminToken}` },
    body: { name: 'Hacked Customer Name' },
  });
  assert(crossCustomerUpdateRes.status === 404, 'Cross-tenant customer update returns 404 (IDOR prevented)');

  // Test 4.4: IDOR on POD verify
  const crossPodVerifyRes = await api(`/api/pod/${tenantBShipment._id}/verify`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${validAdminToken}` },
  });
  assert(crossPodVerifyRes.status === 404, 'Cross-tenant POD verify returns 404 (IDOR prevented)');

  // Test 4.5: IDOR on Payment collect
  const crossPaymentCollectRes = await api(`/api/payments/${tenantBPayment._id}/collect`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${validAdminToken}` },
  });
  assert(crossPaymentCollectRes.status === 404, 'Cross-tenant payment collect returns 404 (IDOR prevented)');

  // Test 4.6: IDOR on Invoice read
  const crossInvoiceRes = await api(`/api/invoices/${tenantBInvoice._id}`, {
    headers: { Authorization: `Bearer ${validAdminToken}` },
  });
  assert(crossInvoiceRes.status === 404, 'Cross-tenant invoice read returns 404 (IDOR prevented)');

  // Test 4.7: Mass Assignment protection: Customer company_id cannot be overwritten
  const tenantACustomer = await Customer.create({
    company_id: primaryCompany._id,
    name: 'Tenant A Original Client',
    phone: '9999111101',
  });
  await api(`/api/customers/${tenantACustomer._id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${validAdminToken}` },
    body: {
      name: 'Tenant A Renamed Client',
      company_id: tenantB._id.toString(), // Attacker attempts to change company ownership
    },
  });
  const reloadedCustomer = await Customer.findById(tenantACustomer._id);
  assert(reloadedCustomer.company_id.toString() === primaryCompany._id.toString(), 'Mass-assignment of company_id strictly blocked on Customer update');

  console.log('\n--- 5. BRANCH-LEVEL ACCESS CONTROL ---');

  // Test 5.1: Branch manager restricted to assigned branch
  const branchManager = await User.create({
    username: 'sec_test_bmanager',
    password: await bcrypt.hash('Manager@123', 10),
    role: 'manager',
    company_id: primaryCompany._id,
    branch_ids: [branchA._id],
    is_active: true,
  });
  const bmLoginRes = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'sec_test_bmanager', password: 'Manager@123' },
  });
  const bmToken = bmLoginRes.body.token;

  // Access assigned branch (Branch A)
  const bmBranchARes = await api(`/api/shipments?branch_id=${branchA._id}`, {
    headers: { Authorization: `Bearer ${bmToken}` },
  });
  assert(bmBranchARes.status === 200, 'Branch manager accesses assigned branch (200 OK)');

  // Access unassigned branch (Branch B)
  const bmBranchBRes = await api(`/api/shipments?branch_id=${branchB._id}`, {
    headers: { Authorization: `Bearer ${bmToken}` },
  });
  assert(bmBranchBRes.status === 403, 'Branch manager blocked from unassigned branch (403 Forbidden)');

  // Test 5.2: Shipment transfer authorization
  const branchAShipment = await Shipment.create({
    company_id: primaryCompany._id,
    branch_id: branchA._id,
    lr_number: 'LWSECTRANSFER01',
    sender_name: 'Sender A',
    receiver_name: 'Receiver A',
    destination: 'Branch B City',
    freight_amount: 1500,
  });
  const branchBShipment = await Shipment.create({
    company_id: primaryCompany._id,
    branch_id: branchB._id,
    lr_number: 'LWSECTRANSFER02',
    sender_name: 'Sender B',
    receiver_name: 'Receiver B',
    destination: 'Branch A City',
    freight_amount: 1800,
  });

  // Branch manager attempts to transfer shipment from unassigned Branch B -> REJECTED
  const unauthorizedTransferRes = await api(`/api/shipments/${branchBShipment._id}/transfer`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bmToken}` },
    body: { to_branch_id: branchA._id.toString(), notes: 'Unauthorized transfer attempt' },
  });
  assert(unauthorizedTransferRes.status === 403, 'Transferring shipment from unassigned branch blocked (403)');

  // Branch manager transfers shipment from assigned Branch A to Branch B -> SUCCEEDS
  const authorizedTransferRes = await api(`/api/shipments/${branchAShipment._id}/transfer`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${bmToken}` },
    body: { to_branch_id: branchB._id.toString(), notes: 'Authorized route dispatch' },
  });
  assert(authorizedTransferRes.status === 200 && authorizedTransferRes.body.success, 'Authorized shipment transfer succeeds (200 OK)');

  // Test 5.3: Verify transfer audit log
  const transferLog = await AuditLog.findOne({
    event_type: 'branch_transfer',
    'details.shipment_id': branchAShipment._id,
  });
  assert(transferLog && transferLog.branch_id.toString() === branchB._id.toString(), 'Branch transfer successfully recorded in AuditLog');

  console.log('\n--- 6. FILE SECURITY & PATH TRAVERSAL DEFENSE ---');
  const Document = require('./src/models/Document');
  const tenantBDoc = await Document.create({
    company_id: tenantB._id,
    name: 'Confidential_TenantB.pdf',
    original_name: 'Confidential_TenantB.pdf',
    file_path: 'C:\\Windows\\System32\\drivers\\etc\\hosts', // Deliberate traversal attempt
    file_url: '/uploads/documents/fake.pdf',
    mime_type: 'application/pdf',
    size_bytes: 1024,
  });

  // Attempt to download Tenant B document using Tenant A admin token -> 404
  const crossDocRes = await api(`/api/documents/${tenantBDoc._id}/download`, {
    headers: { Authorization: `Bearer ${validAdminToken}` },
  });
  assert(crossDocRes.status === 404, 'Cross-tenant document download blocked with 404');

  // Attempt to download document pointing outside uploadDir using Tenant B token -> 403
  const tenantBAdmin = await User.create({
    username: 'tenant_b_sec_admin',
    password: await bcrypt.hash('Password#123', 10),
    role: 'admin',
    company_id: tenantB._id,
    is_active: true,
  });
  const tenantBLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'tenant_b_sec_admin', password: 'Password#123' },
  });
  const traversalRes = await api(`/api/documents/${tenantBDoc._id}/download`, {
    headers: { Authorization: `Bearer ${tenantBLogin.body.token}` },
  });
  assert(traversalRes.status === 403, 'Path traversal outside upload directory strictly blocked (403)');

  console.log('\n--- 7. NEGATIVE AUTHORIZATION & FINANCIAL CONTROLS ---');
  // Anonymous requests
  const anonUsersRes = await api('/api/users');
  assert(anonUsersRes.status === 401, 'Anonymous request to /api/users rejected with 401');

  const anonShipmentsRes = await api('/api/shipments');
  assert(anonShipmentsRes.status === 401, 'Anonymous request to /api/shipments rejected with 401');

  const anonPaymentsRes = await api('/api/payments');
  assert(anonPaymentsRes.status === 401, 'Anonymous request to /api/payments rejected with 401');

  // Expired JWT token simulation
  const expiredToken = jwt.sign(
    { id: primaryAdmin._id.toString(), username: primaryAdmin.username, role: 'admin', company_id: primaryCompany._id },
    JWT_SECRET,
    { expiresIn: '-1s', algorithm: 'HS256' }
  );
  const expiredRes = await api('/api/auth/me', {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  assert(expiredRes.status === 401, 'Expired JWT token strictly rejected with 401');

  // Unauthorized financial deletion (staff trying to cancel/delete invoice)
  const staffDeleteInvoiceRes = await api(`/api/invoices/${tenantBInvoice._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${validStaffToken}` },
  });
  assert(staffDeleteInvoiceRes.status === 403, 'Staff user deleting invoice blocked with 403 Forbidden');

  // Unauthorized customer deletion
  const staffDeleteCustomerRes = await api(`/api/customers/${tenantACustomer._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${validStaffToken}` },
  });
  assert(staffDeleteCustomerRes.status === 403, 'Staff user deleting customer blocked with 403 Forbidden');

  console.log('\n--- 8. CONCURRENT BOOTSTRAP RACE CONDITION VALIDATION ---');
  // Temporarily reset lock and superadmin count for race test
  await BootstrapLock.deleteMany({});
  await User.deleteMany({ role: { $in: ['superadmin', 'super_admin'] } });

  // Fire 5 simultaneous bootstrap requests concurrently
  const concurrentPromises = [1, 2, 3, 4, 5].map((i) =>
    api('/api/auth/bootstrap-superadmin', {
      method: 'POST',
      body: {
        bootstrap_secret: BOOTSTRAP_SECRET,
        username: `concurrent_superadmin_${i}`,
        password: 'Password@2026#Secure',
      },
    })
  );

  const concurrentResults = await Promise.all(concurrentPromises);
  const successCount = concurrentResults.filter(r => r.status === 201).length;
  const conflictCount = concurrentResults.filter(r => r.status === 409).length;

  assert(successCount === 1, 'Exactly ONE concurrent bootstrap request succeeded (201)');
  assert(conflictCount === 4, 'Remaining 4 concurrent bootstrap requests failed with 409 Conflict');

  const totalSuperAdminsInDb = await User.countDocuments({ role: { $in: ['superadmin', 'super_admin'] } });
  assert(totalSuperAdminsInDb === 1, 'MongoDB contains strictly 1 superadmin after race condition test');

  console.log('\n--- CLEANUP TEMPORARY SECURITY TEST ARTIFACTS ---');
  await User.deleteMany({
    $or: [
      { username: { $in: ['sec_test_admin', 'sec_test_staff', 'sec_test_bmanager', 'bootstrapped_superadmin', 'tenant_b_sec_admin'] } },
      { username: /^concurrent_superadmin_/ },
    ]
  });
  await Document.deleteMany({ _id: tenantBDoc._id });
  await Company.deleteOne({ _id: tenantB._id });
  await Branch.deleteMany({ _id: { $in: [branchA._id, branchB._id, tenantBBranch._id] } });
  await Shipment.deleteMany({ _id: { $in: [tenantBShipment._id, branchAShipment._id, branchBShipment._id] } });
  await Customer.deleteMany({ _id: { $in: [tenantBCustomer._id, tenantACustomer._id] } });
  await Invoice.deleteOne({ _id: tenantBInvoice._id });
  await Payment.deleteMany({ _id: { $in: [tenantBPayment._id] } });
  await POD.deleteMany({ _id: { $in: [tenantBPod._id] } });
  await BootstrapLock.deleteMany({});
  await mongoose.disconnect();
  console.log('🧹 Cleaned up temporary test artifacts.');

  console.log('\n' + '='.repeat(80));
  console.log(`SECURITY VERIFICATION SUMMARY: ${testPassCount} PASSED, ${testFailCount} FAILED`);
  console.log('='.repeat(80));

  if (testFailCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

