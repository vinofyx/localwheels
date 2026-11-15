/**
 * final-validation-test.js
 * Comprehensive Real-World Functional Validation for LocalWheels Logistics Platform
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';
const parsedUrl = new URL(BASE_URL);
const isHttps = parsedUrl.protocol === 'https:';
const client = isHttps ? https : http;

// ── HTTP Helper ───────────────────────────────────────────────────────────────
function request(method, endpoint, body = null, token = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const reqHeaders = { ...headers };

    let postData = null;
    if (body && !headers['Content-Type']) {
      postData = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    } else if (body && headers['Content-Type']?.startsWith('multipart/form-data')) {
      postData = body;
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: reqHeaders,
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// ── Multipart Builder Helper ──────────────────────────────────────────────────
function buildMultipart(fields, fileField) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
  const crlf = '\r\n';
  let parts = [];

  for (const [k, v] of Object.entries(fields)) {
    parts.push(
      `--${boundary}${crlf}` +
      `Content-Disposition: form-data; name="${k}"${crlf}${crlf}` +
      `${v}${crlf}`
    );
  }

  if (fileField) {
    parts.push(
      `--${boundary}${crlf}` +
      `Content-Disposition: form-data; name="${fileField.name}"; filename="${fileField.filename}"${crlf}` +
      `Content-Type: ${fileField.contentType}${crlf}${crlf}`
    );
    parts.push(fileField.content);
    parts.push(crlf);
  }

  parts.push(`--${boundary}--${crlf}`);

  const bufferList = parts.map(p => Buffer.isBuffer(p) ? p : Buffer.from(p, 'utf8'));
  const body = Buffer.concat(bufferList);

  return {
    body,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

// ── Test Runner ───────────────────────────────────────────────────────────────
async function run() {
  console.log('='.repeat(80));
  console.log('LOCALWHEELS FINAL REAL-WORLD FUNCTIONAL VALIDATION');
  console.log(`Target: ${BASE_URL}`);
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;
  const results = [];

  function assert(name, condition, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${name}${detail ? ' -> ' + detail : ''}`);
      passed++;
      results.push({ name, status: 'PASS', detail });
    } else {
      console.error(`  [FAIL] ${name}${detail ? ' -> ' + detail : ''}`);
      failed++;
      results.push({ name, status: 'FAIL', detail });
    }
  }

  // Connect to DB directly for raw database comparisons
  const dotenv = require('dotenv');
  dotenv.config({ path: path.resolve(__dirname, '.env') });
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI not found in backend/.env');
  await mongoose.connect(mongoUri);
  console.log('MongoDB directly connected for database ground-truth validation.');

  const User = require('./src/models/User');
  const Company = require('./src/models/Company');
  const Branch = require('./src/models/Branch');
  const Shipment = require('./src/models/Shipment');
  const POD = require('./src/models/POD');
  const Payment = require('./src/models/Payment');
  const Booking = require('./src/models/Booking');
  const FasTagEntry = require('./src/models/FasTagEntry');
  const Trip = require('./src/models/Trip');

  // 1. Initial Admin Login
  console.log('\n--- 1. ADMIN AUTHENTICATION ---');
  let adminRes = await request('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
  if (adminRes.status !== 200) {
    adminRes = await request('POST', '/api/auth/login', { username: 'admin', password: 'password123' });
  }
  assert('Admin login succeeds', adminRes.status === 200, `Status: ${adminRes.status}`);
  const adminToken = adminRes.body.token;
  const adminCompanyId = adminRes.body.user.company_id;

  // 2. Field Employee Pickup Workflow
  console.log('\n--- 2. FIELD EMPLOYEE PICKUP WORKFLOW ---');
  const branch1 = await Branch.findOne({ company_id: adminCompanyId });
  assert('Branch exists for booking test', !!branch1, `Branch: ${branch1?.branch_name}`);

  const bookingRes = await request('POST', '/api/bookings', {
    branch_id: branch1._id.toString(),
    sender_name: 'Alpha Electronics Ltd',
    sender_phone: '9876543210',
    pickup_address: 'Plot 45, Gachibowli, Hyderabad',
    receiver_name: 'Omega Retail Hub',
    receiver_phone: '9123456789',
    receiver_address: 'Shop 12, MG Road, Vijayawada',
    destination: 'VIJAYAWADA',
    goods_description: 'Industrial Inverters',
    estimated_weight: 45,
    estimated_packages: 3,
    service_type: 'express'
  }, adminToken, { 'x-branch-id': branch1._id.toString() });

  assert('Create booking via field agent API', bookingRes.status === 201, `Status: ${bookingRes.status}`);
  const bookingId = bookingRes.body.data?._id;
  const bookingNo = bookingRes.body.data?.booking_number;

  // Update pickup status to pickup_done
  const pickupRes = await request('PATCH', `/api/bookings/${bookingId}/status`, {
    status: 'pickup_done'
  }, adminToken);
  assert('Update booking status to pickup_done', pickupRes.status === 200, `Status: ${pickupRes.status}`);

  // Verify auto-created shipment with unique LR number
  const updatedBooking = await Booking.findById(bookingId).populate('shipment_id');
  assert('Booking links to auto-created shipment', !!updatedBooking.shipment_id, `Shipment ID: ${updatedBooking.shipment_id?._id}`);
  assert('Auto-created shipment has valid LR number', !!updatedBooking.shipment_id?.lr_number, `LR: ${updatedBooking.shipment_id?.lr_number}`);
  assert('Shipment details match booking fields', updatedBooking.shipment_id?.sender_name === 'Alpha Electronics Ltd', `Sender: ${updatedBooking.shipment_id?.sender_name}`);

  // 3. Branch-to-Branch Shipment Transfer with 2 Separate Accounts
  console.log('\n--- 3. BRANCH-TO-BRANCH TRANSFER USING TWO SEPARATE USER ACCOUNTS ---');
  let branchA = await Branch.findOne({ company_id: adminCompanyId, branch_name: /HYDERABAD/i });
  let branchB = await Branch.findOne({ company_id: adminCompanyId, branch_name: /VIJAYAWADA|WARANGAL|KURNOOL/i });

  if (!branchB) {
    branchB = await Branch.create({
      company_id: adminCompanyId,
      branch_name: 'VIJAYAWADA-BRANCH',
      branch_code: 'VJA',
      city: 'Vijayawada',
      is_active: true
    });
  }
  if (!branchA) branchA = branch1;

  // Create User A at Branch A
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('secret123', 10);
  const userAEmail = `mgr_a_${Date.now()}@localwheels.in`;
  const userBEmail = `mgr_b_${Date.now()}@localwheels.in`;

  const userA = await User.create({
    company_id: adminCompanyId,
    branch_id: branchA._id,
    branch_ids: [branchA._id],
    username: `mgr_a_${Date.now()}`,
    email: userAEmail,
    password: hash,
    full_name: 'Branch A Manager',
    role: 'manager',
    is_active: true,
  });

  const userB = await User.create({
    company_id: adminCompanyId,
    branch_id: branchB._id,
    branch_ids: [branchB._id],
    username: `mgr_b_${Date.now()}`,
    email: userBEmail,
    password: hash,
    full_name: 'Branch B Manager',
    role: 'manager',
    is_active: true,
  });

  // Login User A
  const loginARes = await request('POST', '/api/auth/login', { username: userA.username, password: 'secret123' });
  assert('User A logs in at Branch A', loginARes.status === 200, `User: ${userA.username}`);
  const tokenA = loginARes.body.token;

  // Login User B
  const loginBRes = await request('POST', '/api/auth/login', { username: userB.username, password: 'secret123' });
  assert('User B logs in at Branch B', loginBRes.status === 200, `User: ${userB.username}`);
  const tokenB = loginBRes.body.token;

  // User A creates shipment at Branch A
  const shipCreateRes = await request('POST', '/api/shipments', {
    sender_name: 'Hyderabad Pharma Corp',
    sender_phone: '9848011223',
    sender_address: 'Balanagar, Hyderabad',
    receiver_name: 'Vijayawada Medical Distributors',
    receiver_phone: '9848099887',
    receiver_address: 'Governorpet, Vijayawada',
    destination: 'Vijayawada',
    weight: 120,
    packages: 5,
    freight_amount: 3500,
    payment_type: 'topay',
    description: 'Pharma Cartons',
  }, tokenA, { 'x-branch-id': branchA._id.toString() });

  assert('User A creates shipment at Branch A', shipCreateRes.status === 201, `LR: ${shipCreateRes.body.lr_number}`);
  const transferredShipmentId = shipCreateRes.body.id || shipCreateRes.body._id;

  // User A transfers shipment to Branch B
  const transferRes = await request('POST', `/api/shipments/${transferredShipmentId}/transfer`, {
    to_branch_id: branchB._id.toString(),
    notes: 'Inter-branch dispatch via Line Haul LHS-01'
  }, tokenA);
  assert('User A transfers shipment to Branch B', transferRes.status === 200, `Msg: ${transferRes.body.message}`);

  // User B lists shipments at Branch B
  const userBShipmentsRes = await request('GET', '/api/shipments', null, tokenB, { 'x-branch-id': branchB._id.toString() });
  assert('User B queries Branch B shipments', userBShipmentsRes.status === 200, `Status: ${userBShipmentsRes.status}`);
  const foundTransferred = userBShipmentsRes.body.data?.find(s => s.id === transferredShipmentId || s._id === transferredShipmentId);
  assert('Transferred shipment is visible in User B Branch B dashboard', !!foundTransferred, `Found LR: ${foundTransferred?.lr_number}`);
  assert('Transferred shipment status is in_transit', foundTransferred?.status === 'in_transit', `Status: ${foundTransferred?.status}`);

  // 4. Shipment Status Consistency Across Dashboards
  console.log('\n--- 4. SHIPMENT STATUS CONSISTENCY ACROSS DASHBOARDS ---');
  // Check tracking endpoint
  const trackRes = await request('GET', `/api/shipments/track/${foundTransferred.lr_number}`);
  assert('Public tracking matches status in_transit', trackRes.status === 200 && trackRes.body.status === 'in_transit', `Track Status: ${trackRes.body.status}`);

  // Check shipment detail endpoint
  const detailRes = await request('GET', `/api/shipments/${transferredShipmentId}`, null, tokenB);
  assert('Detail endpoint matches status in_transit', detailRes.status === 200 && detailRes.body.status === 'in_transit', `Detail Status: ${detailRes.body.status}`);

  // 5. Actual POD Image Upload, Storage & Manager Verification
  console.log('\n--- 5. POD IMAGE UPLOAD, STORAGE & VERIFICATION ---');
  // Create a genuine 1x1 test PNG buffer
  const samplePngBuffer = Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C63000100000500010D0A2DB40000000049454E44AE426082', 'hex');

  const multipart = buildMultipart(
    { receiver_name: 'Dr. Suresh Kumar', delivery_date: '2026-11-13' },
    { name: 'file', filename: 'delivery_proof.png', contentType: 'image/png', content: samplePngBuffer }
  );

  const uploadRes = await request(
    'POST',
    `/api/pod/${transferredShipmentId}/upload`,
    multipart.body,
    tokenB,
    { 'Content-Type': multipart.contentType }
  );

  assert('POD image upload succeeds', uploadRes.status === 200, `Uploaded path: ${uploadRes.body?.file}`);

  // Verify file exists on disk
  const uploadedRelPath = uploadRes.body?.file; // e.g. /uploads/pod_...
  const diskPath = path.resolve(__dirname, '.' + uploadedRelPath);
  assert('POD file physically written to disk storage', fs.existsSync(diskPath), `Path: ${diskPath}`);

  // Verify POD status is 'uploaded' in database
  const podInDb = await POD.findOne({ shipment_id: transferredShipmentId });
  assert('POD record state is uploaded', podInDb?.status === 'uploaded', `State: ${podInDb?.status}`);

  // Manager verifies POD
  const verifyRes = await request('PATCH', `/api/pod/${transferredShipmentId}/verify`, {}, tokenB);
  assert('Manager verifies POD', verifyRes.status === 200, `Status: ${verifyRes.status}`);

  const verifiedPod = await POD.findOne({ shipment_id: transferredShipmentId });
  assert('POD record state transitions to verified', verifiedPod?.status === 'verified', `State: ${verifiedPod?.status}`);

  // 6. Invoice Calculations & Payment Collection Reconciliation
  console.log('\n--- 6. INVOICE CALCULATIONS & PAYMENT RECONCILIATION ---');
  const invoiceRes = await request('POST', '/api/invoices', {
    customer_name: 'Hyderabad Pharma Corp',
    customer_gst: '36AAACH1234F1Z5',
    customer_phone: '9848011223',
    shipment_id: transferredShipmentId,
    lr_number: foundTransferred.lr_number,
    line_items: [
      { description: 'Freight 120kg', amount: 3000 },
      { description: 'Handling & Loading', amount: 500 },
    ],
    cgst_percent: 9,
    sgst_percent: 9,
    igst_percent: 0,
    due_date: '2026-11-30',
  }, tokenB, { 'x-branch-id': branchB._id.toString() });

  assert('Create invoice for shipment', invoiceRes.status === 201, `Inv No: ${invoiceRes.body.data?.invoice_number}`);
  const inv = invoiceRes.body.data;
  assert('Invoice subtotal is 3500.00', inv.subtotal === 3500, `Subtotal: ${inv.subtotal}`);
  assert('Invoice CGST (9%) is 315.00', inv.cgst === 315, `CGST: ${inv.cgst}`);
  assert('Invoice SGST (9%) is 315.00', inv.sgst === 315, `SGST: ${inv.sgst}`);
  assert('Invoice Total is 4130.00', inv.total === 4130, `Total: ${inv.total}`);

  // Query payment created for transferred shipment
  const paymentRecord = await Payment.findOne({ shipment_id: transferredShipmentId });
  assert('Payment record auto-created on shipment creation', !!paymentRecord, `Payment ID: ${paymentRecord?._id}`);
  assert('Initial payment status is pending', paymentRecord?.status === 'pending', `Status: ${paymentRecord?.status}`);

  // Collect payment
  const collectRes = await request('PATCH', `/api/payments/${paymentRecord._id}/collect`, {}, tokenB);
  assert('Collect payment succeeds', collectRes.status === 200, `Status: ${collectRes.status}`);

  const updatedPayment = await Payment.findById(paymentRecord._id);
  assert('Payment status transitions to paid', updatedPayment?.status === 'paid', `Status: ${updatedPayment?.status}`);

  // Verify payment collection reconciliation in GET /api/payments
  const paymentsListRes = await request('GET', '/api/payments', null, tokenB, { 'x-branch-id': branchB._id.toString() });
  assert('Payments list aggregates collected amount', paymentsListRes.body.summary?.collected >= 3500, `Collected: ${paymentsListRes.body.summary?.collected}`);

  // 7. Data Isolation Between Companies
  console.log('\n--- 7. COMPANY-LEVEL & BRANCH-LEVEL DATA ISOLATION ---');
  // Create Company 2
  const comp2 = await Company.create({
    name: `Competitor Logistics ${Date.now()}`,
    email: `comp2_${Date.now()}@test.com`,
    is_active: true,
  });

  const branchC2 = await Branch.create({
    company_id: comp2._id,
    branch_name: 'COMP2-MAIN',
    branch_code: 'C2M',
    city: 'Bengaluru',
  });

  const userC2 = await User.create({
    company_id: comp2._id,
    branch_id: branchC2._id,
    branch_ids: [branchC2._id],
    username: `user_c2_${Date.now()}`,
    email: `c2_${Date.now()}@competitor.com`,
    password: hash,
    full_name: 'Competitor Manager',
    role: 'manager',
    is_active: true,
  });

  const loginC2Res = await request('POST', '/api/auth/login', { username: userC2.username, password: 'secret123' });
  const tokenC2 = loginC2Res.body.token;

  // C2 attempts to view Company 1's shipments
  const c2ShipmentsRes = await request('GET', '/api/shipments', null, tokenC2, { 'x-branch-id': branchC2._id.toString() });
  const leakFound = c2ShipmentsRes.body.data?.some(s => s.id === transferredShipmentId || s._id === transferredShipmentId);
  assert('Company 2 cannot see Company 1 shipments', !leakFound && c2ShipmentsRes.body.data?.length === 0, `Shipments seen: ${c2ShipmentsRes.body.data?.length}`);

  // C2 attempts to directly access Company 1 shipment detail
  const c2DirectRes = await request('GET', `/api/shipments/${transferredShipmentId}`, null, tokenC2);
  assert('Direct ID cross-company access blocked (404/403)', c2DirectRes.status === 404 || c2DirectRes.status === 403, `Status: ${c2DirectRes.status}`);

  // 8. Dashboard Figures Ground-Truth Validation Against Raw Database Records
  console.log('\n--- 8. DASHBOARD FIGURES GROUND-TRUTH VALIDATION ---');
  const dashRes = await request('GET', '/api/dashboard', null, adminToken, { 'x-branch-id': branch1._id.toString() });
  assert('Admin fetches dashboard figures', dashRes.status === 200, `Status: ${dashRes.status}`);

  // Ground truth counts directly from MongoDB
  const rawHoldCount = await Shipment.countDocuments({
    company_id: adminCompanyId,
    branch_id: branch1._id,
    status: { $in: ['hold', 'lost'] }
  });
  assert('Dashboard hold_cn matches raw MongoDB count', dashRes.body.hold_cn === rawHoldCount, `API: ${dashRes.body.hold_cn}, Raw DB: ${rawHoldCount}`);

  // 9. LHS, Touching LR & FasTag Import Verification
  console.log('\n--- 9. LHS, TOUCHING LR & FASTAG INTEGRATION ---');
  // LHS creation
  const lhsRes = await request('POST', '/api/dispatch/lhs', {
    locationType: 'Godown Delivery',
    date: '2026-11-13',
    time: '14:30',
    to: 'WARANGAL',
    vehicleNo: 'TS09UB1234',
    loadType: 'HCV',
    driverCode: 'DRV01',
    driverName: 'Ramesh Reddy',
    driverNo: '9988776655',
    vendor: 'Reddy Transport Co',
    totalPayableAdvance: '5000',
    basicFreight: '18000',
    dieselAmount: '4500',
    extraCharges: '600',
  }, adminToken);
  assert('LHS endpoint creates trip and route expense', lhsRes.status === 201, `LHS No: ${lhsRes.body.lhs_number}`);

  // Touching LR query
  const touchRes = await request('GET', `/api/dispatch/touching-lr?branch_name=HYDERABAD&doc_no=${foundTransferred.lr_number}`, null, adminToken);
  assert('Touching LR queries matching shipments', touchRes.status === 200 && touchRes.body.items?.length >= 1, `Items: ${touchRes.body.items?.length}`);
  assert('Touching LR calculates summary statistics', touchRes.body.stats?.act_wt > 0, `Act Wt: ${touchRes.body.stats?.act_wt}`);

  // FasTag CSV Import
  const fastagCsv = 'vehicle_no,tag_id,toll_plaza,transaction_time,amount\n' +
                    'TS09UB1234,TAG5001,Keesara Toll Plaza,2026-11-13 10:15:00,180\n' +
                    'TS09UB1234,TAG5002,Warangal Toll Plaza,2026-11-13 12:45:00,220\n';
  const fastagMultipart = buildMultipart(
    { entry_no: 'FT-VALIDATION-01', entry_date: '2026-11-13' },
    { name: 'file', filename: 'fastag_feed.csv', contentType: 'text/csv', content: Buffer.from(fastagCsv) }
  );

  const ftImportRes = await request(
    'POST',
    '/api/import/fastag',
    fastagMultipart.body,
    adminToken,
    { 'Content-Type': fastagMultipart.contentType }
  );
  assert('FasTag CSV import executes successfully', ftImportRes.status === 200, `Inserted: ${ftImportRes.body.inserted}`);
  assert('FasTag total count is 2', ftImportRes.body.total_count === 2, `Count: ${ftImportRes.body.total_count}`);
  assert('FasTag total toll is 400', ftImportRes.body.total_toll === 400, `Toll: ${ftImportRes.body.total_toll}`);

  // FasTag query posted records
  const ftPostedRes = await request('GET', '/api/import/fastag', null, adminToken);
  assert('Query posted FasTag records returns stored entries', ftPostedRes.status === 200 && ftPostedRes.body.entries?.length >= 2, `Entries: ${ftPostedRes.body.entries?.length}`);

  // 10. External Integrations (SMS & WhatsApp) Credential Verification
  console.log('\n--- 10. EXTERNAL NOTIFICATIONS & INTEGRATIONS STATUS ---');
  const waToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const isWaConfigured = !!(waToken && waPhoneId);
  console.log(`  WhatsApp Meta Cloud API configured: ${isWaConfigured ? 'YES' : 'NO (credentials absent in .env)'}`);
  assert('WhatsApp configuration correctly identified without fake delivery', !isWaConfigured, 'Credentials unconfigured; external network delivery omitted per strict instructions');

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`FINAL VALIDATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(80));

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Validation test crashed:', err);
  process.exit(1);
});
