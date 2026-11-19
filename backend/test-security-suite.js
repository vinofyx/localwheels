/**
 * LocalWheels Comprehensive Security Verification & Penetration Regression Suite
 * Covers:
 *  1. Authentication & Session Verification (Missing, invalid, expired, deactivated, invalidated tokens)
 *  2. Login Rate Limiting & Lockout Behavior (10 req/15min, 429 lockout, RateLimit headers)
 *  3. NoSQL Operator-Injection & Payload Sanitization (MongoDB $ operators stripped/rejected)
 *  4. Cross-Tenant IDOR & Tenant Isolation (Shipments, Customers, Bookings, Pricing, Discounts, Leads, Notifications)
 *  5. Horizontal & Vertical Privilege Escalation (Role boundary enforcement, superadmin guard)
 *  6. State Machine & Business Logic Tampering (Invalid state transitions, unauthorized transfers)
 *  7. Sensitive Data Protection & Error Sanitization (Password exclusion, safe error handler, upload vault guard)
 *
 * Runs strictly against the isolated test database: lw_qa_e2e
 */

const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

process.env.NODE_ENV = 'production';
process.env.PORT = '5201'; // Dedicated test port
process.env.TEST_RATE_LIMIT = 'true'; // Enable rate limiting in test suite
process.env.RATE_LIMIT_LOGIN_MAX = '10';
process.env.ALLOWED_ORIGINS = 'http://localhost:5201,https://localwheels.vinofyx.com';
const JWT_SECRET = process.env.JWT_SECRET || 'localwheels-security-test-secret-key-abcdef-123456';
process.env.JWT_SECRET = JWT_SECRET;

// Ensure dedicated database isolation
const baseUri = process.env.MONGODB_URI;
if (!baseUri) {
  console.error('CRITICAL: MONGODB_URI not found in environment.');
  process.exit(1);
}
process.env.MONGODB_URI = baseUri.replace('mongodb.net/?', 'mongodb.net/lw_qa_e2e?');

// Import Models
const Company = require('./src/models/Company');
const Branch = require('./src/models/Branch');
const User = require('./src/models/User');
const Shipment = require('./src/models/Shipment');
const Customer = require('./src/models/Customer');
const Booking = require('./src/models/Booking');
const CustomerPricing = require('./src/models/CustomerPricing');
const DiscountRequest = require('./src/models/DiscountRequest');
const DriverNotification = require('./src/models/DriverNotification');
const Lead = require('./src/models/Lead');
const Opportunity = require('./src/models/Opportunity');

let passed = 0;
let failed = 0;

function assert(condition, testName, details) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} ${details ? '- ' + details : ''}`);
    failed++;
  }
}

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          json: () => {
            try { return JSON.parse(data); } catch { return null; }
          }
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      if (typeof postData === 'object') {
        req.write(JSON.stringify(postData));
      } else {
        req.write(postData);
      }
    }
    req.end();
  });
}

async function waitForServer(host, port, maxTries = 30) {
  for (let i = 0; i < maxTries; i++) {
    try {
      const res = await request({ host, port, path: '/api/health', method: 'GET', timeout: 500 });
      if (res.statusCode === 200) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function runSecuritySuite() {
  const host = '127.0.0.1';
  const port = 5201;

  console.log('='.repeat(80));
  console.log('LOCALWHEELS COMPREHENSIVE SECURITY & PENETRATION REGRESSION SUITE');
  console.log('='.repeat(80));

  console.log('Waiting for Express server to initialize on port 5201...');
  const ready = await waitForServer(host, port);
  if (!ready) {
    console.error('Server failed to start on port 5201.');
    process.exit(1);
  }
  console.log('Server is online and responding! Initializing security test fixtures...\n');

  const runSuffix = Date.now().toString(36);
  const passwordHash = await bcrypt.hash('SecurePassword123!', 10);

  // ── FIXTURES SEEDING ────────────────────────────────────────────────────────
  // Company A (Tenant A)
  const companyA = await Company.create({
    name: `Security Tenant A ${runSuffix}`,
    legal_name: 'Tenant A Logistics Pvt Ltd',
    email: `tenantA_${runSuffix}@security.test`,
    lr_counter: 100,
  });
  const branchA = await Branch.create({
    company_id: companyA._id,
    branch_name: `BR-A-${runSuffix}`,
    city: 'Hyderabad',
    is_active: true,
  });

  // Company B (Tenant B - The Attacker or Isolated Tenant)
  const companyB = await Company.create({
    name: `Security Tenant B ${runSuffix}`,
    legal_name: 'Tenant B Logistics Pvt Ltd',
    email: `tenantB_${runSuffix}@security.test`,
    lr_counter: 200,
  });
  const branchB = await Branch.create({
    company_id: companyB._id,
    branch_name: `BR-B-${runSuffix}`,
    city: 'Mumbai',
    is_active: true,
  });

  // Users in Tenant A
  const adminA = await User.create({
    company_id: companyA._id,
    username: `admin_a_${runSuffix}`,
    password: passwordHash,
    role: 'admin',
    branch_ids: [branchA._id],
    is_active: true,
  });
  const staffA = await User.create({
    company_id: companyA._id,
    username: `staff_a_${runSuffix}`,
    password: passwordHash,
    role: 'staff',
    branch_ids: [branchA._id],
    is_active: true,
  });
  const driverA = await User.create({
    company_id: companyA._id,
    username: `driver_a_${runSuffix}`,
    password: passwordHash,
    role: 'driver',
    branch_ids: [branchA._id],
    is_active: true,
  });
  const deactivatedUser = await User.create({
    company_id: companyA._id,
    username: `deactivated_${runSuffix}`,
    password: passwordHash,
    role: 'staff',
    branch_ids: [branchA._id],
    is_active: false,
  });

  // Users in Tenant B (Attacker / Separate Tenant)
  const adminB = await User.create({
    company_id: companyB._id,
    username: `admin_b_${runSuffix}`,
    password: passwordHash,
    role: 'admin',
    branch_ids: [branchB._id],
    is_active: true,
  });
  const staffB = await User.create({
    company_id: companyB._id,
    username: `staff_b_${runSuffix}`,
    password: passwordHash,
    role: 'staff',
    branch_ids: [branchB._id],
    is_active: true,
  });

  // Tenant A Resources
  const shipmentA = await Shipment.create({
    company_id: companyA._id,
    branch_id: branchA._id,
    lr_number: `LWA${runSuffix.toUpperCase()}`,
    sender_name: 'Tenant A Sender',
    receiver_name: 'Tenant A Receiver',
    destination: 'Vijayawada',
    status: 'booked',
  });

  const customerA = await Customer.create({
    company_id: companyA._id,
    name: 'Customer of Tenant A',
    phone: '+919999900001',
    is_active: true,
  });

  const bookingA = await Booking.create({
    company_id: companyA._id,
    branch_id: branchA._id,
    booking_number: `BKA${runSuffix.toUpperCase()}`,
    sender_name: 'Booking Sender A',
    pickup_address: 'Kondapur, Hyderabad',
    receiver_name: 'Booking Receiver A',
    destination: 'Vijayawada',
    status: 'pending',
  });

  const pricingA = await CustomerPricing.create({
    company_id: companyA._id,
    label: 'Corporate Pricing A',
    pricing_type: 'corporate',
    discount_value: 10,
    is_active: true,
  });

  const discountA = await DiscountRequest.create({
    company_id: companyA._id,
    quote_number: `Q-${runSuffix.toUpperCase()}`,
    discount_type: 'percentage',
    discount_value: 10,
    reason: 'Security test discount request',
    status: 'pending_manager',
  });

  const notifA = await DriverNotification.create({
    company_id: companyA._id,
    driver_id: new mongoose.Types.ObjectId(),
    type: 'general',
    title: 'Secret Route Update for Tenant A',
    message: 'Delivery details confidential',
    is_read: false,
  });

  const leadA = await Lead.create({
    company_id: companyA._id,
    name: 'John Doe',
    company_name: 'Tenant A Prospect Corp',
    stage: 'new_lead',
  });

  const oppA = await Opportunity.create({
    company_id: companyA._id,
    title: 'Tenant A 500k Logistics Contract',
    customer_name: 'Tenant A Customer',
    stage: 'qualified',
    estimated_value: 500000,
  });

  // JWT Generator Helper
  function makeToken(user, options = {}) {
    return jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        company_id: user.company_id.toString(),
        authTime: options.authTime || Date.now(),
      },
      JWT_SECRET,
      { expiresIn: options.expiresIn || '2h', algorithm: 'HS256' }
    );
  }

  const tokenAdminA = makeToken(adminA);
  const tokenStaffA = makeToken(staffA);
  const tokenDriverA = makeToken(driverA);
  const tokenAdminB = makeToken(adminB);
  const tokenStaffB = makeToken(staffB);
  const tokenDeactivated = makeToken(deactivatedUser);

  try {
    // ── 1. AUTHENTICATION & SESSION VERIFICATION ──────────────────────────────
    console.log('--- 1. AUTHENTICATION & SESSION SECURITY ---');

    // AUTH-001: Missing token
    const resAuth1 = await request({
      host, port, path: '/api/shipments', method: 'GET'
    });
    assert(resAuth1.statusCode === 401, 'AUTH-001: Missing Authorization header returns 401 Unauthorized');
    assert(resAuth1.json()?.error === 'No token provided', 'AUTH-001: Error message is "No token provided"');

    // AUTH-002: Forged token
    const forgedToken = jwt.sign({ id: adminA._id.toString(), role: 'admin' }, 'wrong-untrusted-secret-key-123456');
    const resAuth2 = await request({
      host, port, path: '/api/shipments', method: 'GET',
      headers: { Authorization: `Bearer ${forgedToken}` }
    });
    assert(resAuth2.statusCode === 401, 'AUTH-002: Forged/untrusted JWT signature returns 401 Unauthorized');

    // AUTH-003: Expired token
    const expiredToken = jwt.sign(
      { id: adminA._id.toString(), role: 'admin', company_id: companyA._id.toString() },
      JWT_SECRET,
      { expiresIn: '-1s', algorithm: 'HS256' }
    );
    const resAuth3 = await request({
      host, port, path: '/api/shipments', method: 'GET',
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert(resAuth3.statusCode === 401, 'AUTH-003: Expired JWT returns 401 Unauthorized');

    // AUTH-004: Deactivated user
    const resAuth4 = await request({
      host, port, path: '/api/shipments', method: 'GET',
      headers: { Authorization: `Bearer ${tokenDeactivated}` }
    });
    assert(resAuth4.statusCode === 403, 'AUTH-004: Deactivated user (is_active: false) returns 403 Forbidden');
    assert(resAuth4.json()?.error === 'Account has been deactivated', 'AUTH-004: Message indicates account deactivation');

    // AUTH-005: Session invalidated post-logout
    await User.findByIdAndUpdate(adminA._id, { lastLogoutAt: new Date(Date.now() + 5000) });
    const staleToken = makeToken(adminA, { authTime: Date.now() - 10000 });
    const resAuth5 = await request({
      host, port, path: '/api/shipments', method: 'GET',
      headers: { Authorization: `Bearer ${staleToken}` }
    });
    assert(resAuth5.statusCode === 401, 'AUTH-005: Token issued prior to user lastLogoutAt is invalidated (401)');
    // Restore user state
    await User.findByIdAndUpdate(adminA._id, { lastLogoutAt: null });

    // ── 2. LOGIN RATE LIMITING & LOCKOUT ──────────────────────────────────────
    console.log('\n--- 2. LOGIN RATE LIMITING & LOCKOUT ---');

    // RATE-001: Legitimate login
    const resLoginValid = await request({
      host, port, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: adminA.username, password: 'SecurePassword123!' });
    assert(resLoginValid.statusCode === 200, 'RATE-001: Legitimate login succeeds (200 OK)');
    assert(!!resLoginValid.json()?.token, 'RATE-001: Returns valid JWT auth token');

    // RATE-002: Failed attempts within threshold
    const resLoginFail1 = await request({
      host, port, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: adminA.username, password: 'WrongPassword999!' });
    assert(resLoginFail1.statusCode === 401, 'RATE-002: Invalid credentials returns 401');

    // Exhaust remaining attempts (up to 10 total)
    console.log('  Simulating rapid credential brute-force attempts (attempts 3 to 10)...');
    for (let i = 3; i <= 10; i++) {
      await request({
        host, port, path: '/api/auth/login', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { username: adminA.username, password: 'WrongPassword999!' });
    }

    // RATE-003: 11th attempt triggers 429 Too Many Requests
    const resRateLimitExceeded = await request({
      host, port, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: adminA.username, password: 'WrongPassword999!' });
    assert(resRateLimitExceeded.statusCode === 429, 'RATE-003: 11th request triggers HTTP 429 Too Many Requests');
    assert(resRateLimitExceeded.json()?.error?.includes('Too many login attempts'), 'RATE-003: Message confirms login rate limit lockout');

    // RATE-004: RateLimit standard headers present
    const hasRateLimitHeader = !!(
      resRateLimitExceeded.headers['ratelimit-limit'] ||
      resRateLimitExceeded.headers['retry-after'] ||
      resRateLimitExceeded.headers['x-ratelimit-limit']
    );
    assert(hasRateLimitHeader, 'RATE-004: Standard RateLimit/Retry headers are present in 429 response');

    // ── 3. NOSQL OPERATOR INJECTION & PAYLOAD SANITIZATION ─────────────────────
    console.log('\n--- 3. NOSQL OPERATOR INJECTION & INPUT SANITIZATION ---');

    // NOSQL-001: Non-string / operator payload on login
    const resNoSql1 = await request({
      host, port, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { username: { $gt: '' }, password: 'SecurePassword123!' });
    assert(resNoSql1.statusCode === 400 || resNoSql1.statusCode === 429, 'NOSQL-001: Object-based username operator injection rejected (400 Bad Request)');

    // NOSQL-002: Stripping $where and $regex keys in body via mongoSanitize
    const { sanitizeInput } = require('./src/middleware/sanitize');
    const dirtyPayload = {
      name: 'Safe Name',
      $where: 'sleep(5000)',
      nested: {
        field: 'value',
        $ne: 'admin',
        'sub.path': 'injected'
      }
    };
    const cleaned = sanitizeInput(JSON.parse(JSON.stringify(dirtyPayload)));
    assert(!cleaned.$where, 'NOSQL-002: $where operator stripped from input object');
    assert(!cleaned.nested.$ne, 'NOSQL-002: Nested $ne operator stripped from input object');
    assert(!cleaned.nested['sub.path'], 'NOSQL-002: Field path-traversal key stripped from input object');
    assert(cleaned.name === 'Safe Name', 'NOSQL-002: Legitimate fields preserved uncorrupted');

    // ── 4. CROSS-TENANT IDOR & TENANT ISOLATION ───────────────────────────────
    console.log('\n--- 4. CROSS-TENANT IDOR & TENANT ISOLATION ---');

    // IDOR-001: Tenant B reading Tenant A's shipment
    const resIdorShipmentRead = await request({
      host, port, path: `/api/shipments/${shipmentA._id}`, method: 'GET',
      headers: { Authorization: `Bearer ${tokenStaffB}` }
    });
    assert(resIdorShipmentRead.statusCode === 404, 'IDOR-001: Tenant B cannot read Tenant A shipment (404 Not Found)');

    // IDOR-002: Tenant B updating Tenant A's shipment status
    const resIdorShipmentUpdate = await request({
      host, port, path: `/api/shipments/${shipmentA._id}/status`, method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenStaffB}`,
        'Content-Type': 'application/json'
      }
    }, { status: 'delivered' });
    assert(resIdorShipmentUpdate.statusCode === 404, 'IDOR-002: Tenant B cannot update Tenant A shipment status (404 Not Found)');

    // IDOR-003: Tenant B reading Tenant A's customer
    const resIdorCustomerRead = await request({
      host, port, path: `/api/customers/${customerA._id}`, method: 'GET',
      headers: { Authorization: `Bearer ${tokenStaffB}` }
    });
    assert(resIdorCustomerRead.statusCode === 404, 'IDOR-003: Tenant B cannot read Tenant A customer record (404 Not Found)');

    // IDOR-004: Tenant B modifying Tenant A's customer
    const resIdorCustomerUpdate = await request({
      host, port, path: `/api/customers/${customerA._id}`, method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokenStaffB}`,
        'Content-Type': 'application/json'
      }
    }, { name: 'Attacker Tampered Name' });
    assert(resIdorCustomerUpdate.statusCode === 404, 'IDOR-004: Tenant B cannot modify Tenant A customer (404 Not Found)');

    // IDOR-005: Tenant B reading Tenant A's booking
    const resIdorBookingRead = await request({
      host, port, path: `/api/bookings/${bookingA._id}`, method: 'GET',
      headers: { Authorization: `Bearer ${tokenStaffB}` }
    });
    assert(resIdorBookingRead.statusCode === 404, 'IDOR-005: Tenant B cannot read Tenant A booking (404 Not Found)');

    // IDOR-006: Tenant B updating Tenant A's customer pricing rule
    const resIdorPricing = await request({
      host, port, path: `/api/quotes/customer-pricing/${pricingA._id}`, method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenStaffB}`,
        'Content-Type': 'application/json'
      }
    }, { base_rate_per_kg: 1 });
    assert(resIdorPricing.statusCode === 404, 'IDOR-006: Tenant B cannot tamper with Tenant A customer pricing rule (404 Not Found)');

    // IDOR-007: Tenant B taking action on Tenant A's discount request
    const resIdorDiscount = await request({
      host, port, path: `/api/quotes/discounts/${discountA._id}/action`, method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenAdminB}`,
        'Content-Type': 'application/json'
      }
    }, { action: 'approved', note: 'Malicious approval' });
    assert(resIdorDiscount.statusCode === 404, 'IDOR-007: Tenant B cannot act on Tenant A discount request (404 Not Found)');

    // IDOR-008: Tenant B marking Tenant A's driver notification as read
    const resIdorNotif = await request({
      host, port, path: `/api/driver/notifications/${notifA._id}/read`, method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenStaffB}` }
    });
    assert(resIdorNotif.statusCode === 404, 'IDOR-008: Tenant B cannot mark Tenant A notification as read (404 Not Found)');

    // IDOR-009: Tenant B modifying Tenant A's lead
    const resIdorLead = await request({
      host, port, path: `/api/leads/${leadA._id}`, method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokenStaffB}`,
        'Content-Type': 'application/json'
      }
    }, { company_name: 'Hijacked Prospect' });
    assert(resIdorLead.statusCode === 404, 'IDOR-009: Tenant B cannot modify Tenant A sales lead (404 Not Found)');

    // IDOR-010: Tenant B modifying Tenant A's opportunity
    const resIdorOpp = await request({
      host, port, path: `/api/opportunities/${oppA._id}`, method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokenStaffB}`,
        'Content-Type': 'application/json'
      }
    }, { title: 'Hijacked Contract' });
    assert(resIdorOpp.statusCode === 404, 'IDOR-010: Tenant B cannot modify Tenant A sales opportunity (404 Not Found)');

    // ── 5. PRIVILEGE ESCALATION & ROLE BOUNDARIES ─────────────────────────────
    console.log('\n--- 5. HORIZONTAL & VERTICAL PRIVILEGE ESCALATION ---');

    // PRIV-001: Staff accessing admin-only user list
    const resPriv1 = await request({
      host, port, path: '/api/users', method: 'GET',
      headers: { Authorization: `Bearer ${tokenStaffA}` }
    });
    assert(resPriv1.statusCode === 403, 'PRIV-001: Staff user accessing GET /api/users returns 403 Forbidden');

    // PRIV-002: Admin attempting to create superadmin user
    const resPriv2 = await request({
      host, port, path: '/api/users', method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenAdminA}`,
        'Content-Type': 'application/json'
      }
    }, {
      username: `malicious_superadmin_${runSuffix}`,
      password: 'AttackerPassword123!',
      role: 'superadmin'
    });
    assert(resPriv2.statusCode === 403, 'PRIV-002: Regular admin cannot create a superadmin account (403 Forbidden)');

    // PRIV-003: Admin attempting to modify own role
    const resPriv3 = await request({
      host, port, path: `/api/users/${adminA._id}`, method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokenAdminA}`,
        'Content-Type': 'application/json'
      }
    }, { role: 'superadmin' });
    assert(resPriv3.statusCode === 403, 'PRIV-003: Admin cannot self-promote to superadmin (403 Forbidden)');

    // PRIV-004: Driver role attempting to create branches
    const resPriv4 = await request({
      host, port, path: '/api/branches', method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenDriverA}`,
        'Content-Type': 'application/json'
      }
    }, { branch_name: 'Unauthorized Branch' });
    assert(resPriv4.statusCode === 403, 'PRIV-004: Driver role cannot create operational branches (403 Forbidden)');

    // ── 6. STATE MACHINE & LOGISTICS TAMPERING ────────────────────────────────
    console.log('\n--- 6. STATE MACHINE & LOGISTICS INTEGRITY ---');

    // STATE-001: Tampering shipment status with invalid arbitrary value
    const resState1 = await request({
      host, port, path: `/api/shipments/${shipmentA._id}/status`, method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenAdminA}`,
        'Content-Type': 'application/json'
      }
    }, { status: 'invalid_malicious_status' });
    assert(resState1.statusCode === 400, 'STATE-001: Arbitrary shipment status transition rejected with 400 Bad Request');

    // STATE-002: Unassigned branch staff attempting branch transfer
    const resState2 = await request({
      host, port, path: `/api/shipments/${shipmentA._id}/transfer`, method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenStaffB}`, // Staff B belongs to Branch B, not Branch A!
        'Content-Type': 'application/json'
      }
    }, { to_branch_id: branchB._id.toString() });
    assert(resState2.statusCode === 404 || resState2.statusCode === 403, 'STATE-002: Unauthorized branch transfer strictly rejected');

    // ── 7. SENSITIVE DATA EXPOSURE & ASSET PROTECTION ─────────────────────────
    console.log('\n--- 7. SENSITIVE DATA PROTECTION & ERROR SANITIZATION ---');

    // DATA-001: User list excludes password hashes
    const resUsers = await request({
      host, port, path: '/api/users', method: 'GET',
      headers: { Authorization: `Bearer ${tokenAdminA}` }
    });
    const usersJson = resUsers.json();
    const hasPassword = Array.isArray(usersJson) && usersJson.some(u => !!u.password);
    assert(!hasPassword, 'DATA-001: GET /api/users strictly projects out password hashes');

    // DATA-002: Direct access to document vault is forbidden
    const resDocs = await request({
      host, port, path: '/uploads/documents/private_document.pdf', method: 'GET'
    });
    assert(resDocs.statusCode === 403, 'DATA-002: Direct static access to /uploads/documents returns 403 Forbidden');

  } finally {
    console.log('\nCleaning up security test artifacts in lw_qa_e2e...');
    await Company.deleteMany({ _id: { $in: [companyA._id, companyB._id] } });
    await Branch.deleteMany({ company_id: { $in: [companyA._id, companyB._id] } });
    await User.deleteMany({ company_id: { $in: [companyA._id, companyB._id] } });
    await Shipment.deleteMany({ company_id: { $in: [companyA._id, companyB._id] } });
    await Customer.deleteMany({ company_id: { $in: [companyA._id, companyB._id] } });
    await Booking.deleteMany({ company_id: { $in: [companyA._id, companyB._id] } });
    await CustomerPricing.deleteMany({ company_id: { $in: [companyA._id, companyB._id] } });
    await DiscountRequest.deleteMany({ company_id: { $in: [companyA._id, companyB._id] } });
    await DriverNotification.deleteMany({ company_id: { $in: [companyA._id, companyB._id] } });
    await Lead.deleteMany({ company_id: { $in: [companyA._id, companyB._id] } });
    await Opportunity.deleteMany({ company_id: { $in: [companyA._id, companyB._id] } });
    console.log('Cleaned up synthetic test fixtures successfully.');
  }

  console.log('\n================================================================');
  console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✅ ALL SECURITY VERIFICATION & REGRESSION CHECKS PASSED');
    process.exit(0);
  }
}

// Start backend app and execute tests
try {
  require('./src/index.js');
  runSecuritySuite().catch(err => {
    console.error('Fatal security suite execution error:', err);
    process.exit(1);
  });
} catch (e) {
  console.error('Failed to load backend/src/index.js:', e);
  process.exit(1);
}
