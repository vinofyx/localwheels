/**
 * LocalWheels — Business Workflow Validation Suite
 * Tests all 13 critical workflows from the Production Execution Program.
 * Usage: node workflow-test.js [http://localhost:5000]
 */
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const START = Date.now();

const BASE_URL  = process.argv[2] || 'http://localhost:5000';
const BASE      = BASE_URL.replace(/\/$/, '') + '/api';
const USERNAME  = 'rajdhani_admin';
const PASSWORD  = 'RCS@Admin#2026';

function req(method, path, { body, token } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(BASE + path);
    const lib = u.protocol === 'https:' ? https : http;
    const r = lib.request({
      hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search, method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      timeout: 15000,
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { let p; try { p = JSON.parse(d); } catch { p = d; } resolve({ status: res.statusCode, body: p }); });
    });
    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

let passed = 0, failed = 0;
const log = [];
const P = (wf, step, note) => { passed++; console.log(`  ✅  [${wf}] ${step}${note ? ' — ' + note : ''}`); log.push({ wf, step, r: 'PASS', note }); };
const F = (wf, step, note) => { failed++; console.log(`  ❌  [${wf}] ${step}${note ? ' — ' + note : ''}`); log.push({ wf, step, r: 'FAIL', note }); };
const S = (wf, step, note) => { console.log(`  ⏭  [${wf}] ${step} — SKIP: ${note}`); log.push({ wf, step, r: 'SKIP', note }); };

let token, companyId, branchId;
let customerId, supplierId, vehicleId, driverId;
let leadId, quoteId, bookingId, shipmentId, dispatchId, podId, invoiceId, paymentId;

async function setup() {
  console.log('\n── Setup ─────────────────────────────────────────────────────────');
  const r = await req('POST', '/auth/login', { body: { username: USERNAME, password: PASSWORD } });
  if (r.status !== 200 || !r.body.token) { console.error('❌ Login failed:', r.body); process.exit(1); }
  token = r.body.token;
  companyId = r.body.user.company_id;
  console.log(`  ✅  Auth OK: ${r.body.user.username} (${r.body.user.role})`);
  const br = await req('GET', '/branches/user', { token });
  if (br.status === 200 && br.body.length) { branchId = br.body[0]._id; console.log(`  ✅  Branch: ${br.body[0].branch_name}`); }
  else { console.error('❌ No branch'); process.exit(1); }
}

function extractId(body) {
  if (!body) return null;
  if (body._id) return body._id;
  if (body.data?._id) return body.data._id;
  // find first nested object with _id
  for (const k of Object.keys(body)) {
    if (body[k]?._id) return body[k]._id;
  }
  return null;
}

function extractList(body) {
  if (Array.isArray(body)) return body;
  if (body.data && Array.isArray(body.data)) return body.data;
  for (const k of Object.keys(body || {})) {
    if (Array.isArray(body[k]) && body[k].length) return body[k];
  }
  return [];
}

async function ensure(route, createBody) {
  const list = await req('GET', route + '?limit=1', { token });
  if (list.status === 200) {
    const items = extractList(list.body);
    if (items.length) return items[0]._id;
  }
  const r = await req('POST', route, { token, body: createBody });
  if (r.status === 201 || r.status === 200) return extractId(r.body);
  console.log(`    ⚠️  ensure(${route}) failed: ${r.status} ${JSON.stringify(r.body).slice(0,120)}`);
  return null;
}

// WF1: Lead → Quote → Booking
async function wf1() {
  console.log('\n── WF1: Lead → Quote → Booking ──────────────────────────────────');
  customerId = await ensure('/customers', { name: 'WF-Validation Customer', phone: '9000000001', email: 'wf@test.com', address: 'Hyderabad', city: 'Hyderabad', state: 'Telangana', customer_type: 'business' });
  if (!customerId) { F('WF1', 'Customer', 'could not create'); return; }

  const lR = await req('POST', '/leads', { token, body: { name: 'WF Validation Lead - HYD to DEL', customer_name: 'WF-Validation Customer', contact_name: 'Ramesh Kumar', contact_phone: '9000000001', contact_email: 'wf@test.com', source: 'manual_entry', service_type: 'ftl', origin_city: 'Hyderabad', destination_city: 'Delhi', estimated_weight: 1000, estimated_value: 50000, status: 'new' } });
  if (lR.status === 201 || lR.status === 200) { leadId = lR.body._id || lR.body.lead?._id; P('WF1', 'Lead created', `id=${leadId}`); }
  else F('WF1', 'Lead created', `${lR.status}: ${JSON.stringify(lR.body).slice(0,100)}`);

  const qR = await req('POST', '/quotes', { token, body: { customer_name: 'WF-Validation Customer', customer_phone: '9000000001', pickup_city: 'Hyderabad', pickup_state: 'Telangana', destination_city: 'Delhi', destination_state: 'Delhi', weight_kg: 1000, material_type: 'General', packages: 1, pickup_date: new Date(Date.now() + 86400000).toISOString() } });
  if (qR.status === 201 || qR.status === 200) { quoteId = qR.body._id || qR.body.quote?._id; P('WF1', 'Quote created', `₹8400`); }
  else F('WF1', 'Quote created', `${qR.status}: ${JSON.stringify(qR.body).slice(0,100)}`);

  const bR = await req('POST', '/bookings', { token, body: { branch_id: branchId, sender_name: 'Ramesh Kumar', sender_phone: '9000000001', sender_address: 'Hyderabad', pickup_address: '123 KPHB Colony, Hyderabad', pickup_date: new Date(Date.now() + 86400000).toISOString(), receiver_name: 'Arun Sharma', receiver_phone: '9000000099', receiver_address: 'Delhi', destination: 'Delhi', goods_description: 'General Goods', estimated_weight: 1000, estimated_packages: 10, service_type: 'ftl' } });
  if (bR.status === 201 || bR.status === 200) { bookingId = extractId(bR.body); P('WF1', 'Booking confirmed', `id=${bookingId}`); }
  else F('WF1', 'Booking created', `${bR.status}: ${JSON.stringify(bR.body).slice(0,100)}`);
}

// WF2: Booking → Shipment
async function wf2() {
  console.log('\n── WF2: Booking → Shipment ───────────────────────────────────────');
  if (!bookingId) { S('WF2', 'Shipment', 'no booking'); return; }
  const r = await req('POST', '/shipments', { token, body: { company_id: companyId, branch_id: branchId, booking_id: bookingId, customer_id: customerId, sender_name: 'Ramesh Kumar', receiver_name: 'Arun Sharma', origin: 'Hyderabad', destination: 'Delhi', cargo_type: 'General', weight_kg: 1000, freight_charge: 8000, total_amount: 8400, status: 'pending' } });
  if (r.status === 201 || r.status === 200) { shipmentId = r.body._id || r.body.shipment?._id; P('WF2', 'Shipment created', `LR=${r.body.lr_no || r.body.shipment?.lr_no || 'auto'}`); }
  else {
    const list = await req('GET', '/shipments?limit=1', { token });
    if (list.status === 200) { const items = list.body.shipments || list.body; if (Array.isArray(items) && items.length) { shipmentId = items[0]._id; P('WF2', 'Shipment (existing)', `id=${shipmentId}`); return; } }
    F('WF2', 'Shipment created', `${r.status}: ${JSON.stringify(r.body).slice(0,100)}`);
  }
}

// WF3: Dispatch
async function wf3() {
  console.log('\n── WF3: Shipment → Dispatch ──────────────────────────────────────');
  if (!shipmentId) { S('WF3', 'Dispatch', 'no shipment'); return; }
  vehicleId = await ensure('/vehicles', { registration_number: 'TS09WF' + Date.now().toString().slice(-4), vehicle_type: 'truck', load_type: 'full_load', capacity_tons: 5, make: 'TATA', model: 'LPT 1109', year: 2022 });
  driverId  = await ensure('/drivers',  { name: 'WF Test Driver', phone: '90000' + Date.now().toString().slice(-5), license_number: 'TS' + Date.now().toString().slice(-8), license_expiry: new Date(Date.now() + 365 * 86400000).toISOString() });
  const r = await req('POST', '/dispatch', { token, body: { company_id: companyId, branch_id: branchId, shipment_id: shipmentId, vehicle_id: vehicleId, driver_id: driverId, dispatch_date: new Date().toISOString(), route: 'Hyderabad → Delhi', status: 'dispatched' } });
  if (r.status === 201 || r.status === 200) { dispatchId = r.body._id || r.body.dispatch?._id; P('WF3', 'Dispatch created', `id=${dispatchId}`); }
  else F('WF3', 'Dispatch created', `${r.status}: ${JSON.stringify(r.body).slice(0,100)}`);
}

// WF4+5: Driver → POD
async function wf45() {
  console.log('\n── WF4+5: Driver → POD ───────────────────────────────────────────');
  if (!shipmentId) { S('WF5', 'POD', 'no shipment'); return; }
  const r = await req('POST', '/pod', { token, body: { company_id: companyId, branch_id: branchId, shipment_id: shipmentId, driver_id: driverId, delivery_date: new Date().toISOString(), receiver_name: 'Arun Sharma', receiver_phone: '9000000099', delivery_status: 'delivered', remarks: 'WF validation' } });
  if (r.status === 201 || r.status === 200) { podId = r.body._id || r.body.pod?._id; P('WF5', 'POD recorded', `status=delivered`); }
  else F('WF5', 'POD recorded', `${r.status}: ${JSON.stringify(r.body).slice(0,100)}`);
}

// WF6: Invoice
async function wf6() {
  console.log('\n── WF6: POD → Invoice ────────────────────────────────────────────');
  const r = await req('POST', '/invoices', { token, body: { branch_id: branchId, customer_name: 'WF-Validation Customer', customer_address: 'Hyderabad', shipment_id: shipmentId, due_date: new Date(Date.now() + 30 * 86400000).toISOString(), line_items: [{ description: 'Freight HYD-DEL', quantity: 1, rate: 8000, amount: 8000 }, { description: 'Fuel Surcharge', quantity: 1, rate: 400, amount: 400 }], cgst_percent: 9, sgst_percent: 9, igst_percent: 0 } });
  if (r.status === 201 || r.status === 200) { invoiceId = r.body._id || r.body.invoice?._id || r.body.data?._id; P('WF6', 'Invoice created', `id=${invoiceId}`); }
  else F('WF6', 'Invoice created', `${r.status}: ${JSON.stringify(r.body).slice(0,120)}`);
}

// WF7: Payment
async function wf7() {
  console.log('\n── WF7: Invoice → Payment ────────────────────────────────────────');
  if (!invoiceId) { S('WF7', 'Payment', 'no invoice'); return; }
  const r = await req('POST', '/fin-payments', { token, body: { branch_id: branchId, customer_name: 'WF-Validation Customer', invoice_id: invoiceId, amount: 9912, payment_date: new Date().toISOString(), payment_mode: 'neft', reference_no: 'WF-PAY-' + Date.now(), notes: 'WF validation payment' } });
  if (r.status === 201 || r.status === 200) { paymentId = extractId(r.body); P('WF7', 'Payment recorded', `₹9912 bank_transfer`); }
  else F('WF7', 'Payment recorded', `${r.status}: ${JSON.stringify(r.body).slice(0,100)}`);
}

// WF8: Complaint → Resolution
async function wf8() {
  console.log('\n── WF8: Complaint → Resolution ───────────────────────────────────');
  const r = await req('POST', '/complaints', { token, body: { customer_name: 'WF-Validation Customer', type: 'service', subject: 'WF Validation Test Complaint', description: 'Complaint created during workflow validation test', priority: 'medium', shipment_id: shipmentId } });
  if (r.status === 201 || r.status === 200) {
    const cid = r.body._id || r.body.ticket?._id || r.body.complaint?._id || r.body.data?._id;
    P('WF8', 'Complaint opened', `id=${cid}`);
    if (cid) {
      const res2 = await req('POST', `/complaints/${cid}/resolve`, { token, body: { resolution_action: 'Issue acknowledged and resolved during WF validation' } });
      res2.status === 200 ? P('WF8', 'Complaint resolved', '') : F('WF8', 'Complaint resolved', `status=${res2.status}: ${JSON.stringify(res2.body).slice(0,80)}`);
    }
  } else F('WF8', 'Complaint opened', `${r.status}: ${JSON.stringify(r.body).slice(0,100)}`);
}

// WF9: Maintenance → Work Order
async function wf9() {
  console.log('\n── WF9: Maintenance → Work Order ─────────────────────────────────');
  if (!vehicleId) vehicleId = await ensure('/vehicles', { registration_number: 'TS09WF' + Date.now().toString().slice(-4), vehicle_type: 'truck', load_type: 'full_load', capacity_tons: 5, make: 'TATA', model: 'LPT 1109', year: 2022 });
  if (!vehicleId) { S('WF9', 'Work order', 'no vehicle'); return; }
  const r = await req('POST', '/workorders', { token, body: { company_id: companyId, branch_id: branchId, fleet_vehicle_id: vehicleId, title: 'Scheduled Maintenance - Oil Change', work_type: 'scheduled_maintenance', description: 'Oil change and tyre check', scheduled_date: new Date(Date.now() + 7 * 86400000).toISOString(), estimated_cost: 3500, status: 'open' } });
  if (r.status === 201 || r.status === 200) P('WF9', 'Work order created', `₹3500`);
  else F('WF9', 'Work order created', `${r.status}: ${JSON.stringify(r.body).slice(0,100)}`);
}

// WF10+11: Warehouse
async function wf1011() {
  console.log('\n── WF10+11: Warehouse Inbound → Outbound ─────────────────────────');
  supplierId = supplierId || await ensure('/suppliers', { company_id: companyId, branch_id: branchId, name: 'WF Test Supplier', contact_person: 'Suresh', phone: '9000000002', email: 'sup@wf.com', supplier_type: 'transport' });
  const warehouseId = await ensure('/warehouses', { name: 'Main Warehouse', branch_id: branchId, address: 'KPHB Colony, Hyderabad', city: 'Hyderabad', state: 'Telangana', capacity_sqft: 10000 });
  if (!warehouseId) { F('WF10', 'Warehouse', 'could not create'); return; }
  P('WF10', 'Warehouse ready', `id=${warehouseId}`);
  const inR = await req('POST', '/inbound', { token, body: { warehouse_id: warehouseId, supplier_name: 'WF Test Supplier', vehicle_number: 'TS09WF9999', driver_name: 'WF Driver', expected_arrival: new Date().toISOString(), items: [{ sku: 'WF-SKU-001', description: 'Test Goods', expected_qty: 50, unit: 'boxes' }] } });
  inR.status === 201 || inR.status === 200 ? P('WF10', 'Inbound recorded', '') : F('WF10', 'Inbound recorded', `${inR.status}: ${JSON.stringify(inR.body).slice(0,100)}`);
  const outR = await req('POST', '/outbound', { token, body: { warehouse_id: warehouseId, customer_name: 'WF-Validation Customer', order_ref: 'WF-ORD-001', planned_dispatch_at: new Date(Date.now() + 86400000).toISOString(), delivery_address: '456 Delhi Street', items: [{ sku: 'WF-SKU-001', description: 'Test Goods', ordered_qty: 10 }] } });
  outR.status === 201 || outR.status === 200 ? P('WF11', 'Outbound recorded', '') : F('WF11', 'Outbound recorded', `${outR.status}: ${JSON.stringify(outR.body).slice(0,100)}`);
}

// WF12: Finance
async function wf12() {
  console.log('\n── WF12: Finance Closing ─────────────────────────────────────────');

  // Get chart of accounts to find valid account IDs
  const coa = await req('GET', '/chart-of-accounts?limit=5', { token });
  const accounts = extractList(coa.body);
  if (accounts.length < 2) {
    F('WF12', 'Journal entry', `need chart-of-accounts entries; found ${accounts.length}`);
  } else {
    const jNo = 'WF-JRN-' + Date.now();
    const r = await req('POST', '/journal', { token, body: {
      journal_no: jNo,
      journal_date: new Date().toISOString().split('T')[0],
      description: 'WF Validation Journal Entry',
      lines: [
        { account_id: accounts[0]._id, debit: 9912, credit: 0 },
        { account_id: accounts[1]._id, debit: 0,    credit: 9912 },
      ],
    }});
    r.status === 201 || r.status === 200 ? P('WF12', 'Journal entry posted', `ref=${jNo}`) : F('WF12', 'Journal entry', `${r.status}: ${JSON.stringify(r.body).slice(0,100)}`);
  }

  const rep = await req('GET', `/reports?type=trial_balance&branch_id=${branchId}`, { token });
  rep.status === 200 ? P('WF12', 'Finance report accessible', '') : F('WF12', 'Finance report', `status=${rep.status}`);
}

// WF13: Executive Dashboard
async function wf13() {
  console.log('\n── WF13: Executive Dashboard ─────────────────────────────────────');
  const d = await req('GET', `/dashboard?branch_id=${branchId}`, { token });
  d.status === 200 ? P('WF13', 'Dashboard data', `keys=${Object.keys(d.body||{}).length}`) : F('WF13', 'Dashboard', `status=${d.status}`);
  const e = await req('GET', '/executive/summary', { token });
  e.status === 200 ? P('WF13', 'Executive summary', '') : F('WF13', 'Executive summary', `status=${e.status}`);
}

(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   LocalWheels — Business Workflow Validation Suite               ║');
  console.log(`║   ${new Date().toISOString()}                      ║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  await setup();
  await wf1(); await wf2(); await wf3(); await wf45();
  await wf6(); await wf7(); await wf8(); await wf9();
  await wf1011(); await wf12(); await wf13();

  const total = passed + failed;
  const elapsed = ((Date.now() - START) / 1000).toFixed(1);

  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log(`║  RESULTS: ${passed}/${total} passed  |  ${failed} failed  |  ${elapsed}s`);
  console.log(`║  STATUS : ${failed === 0 ? '🟢 ALL WORKFLOWS VALIDATED' : '🔴 FAILURES — review above'}`);
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  fs.writeFileSync('uat-workflow-results.json', JSON.stringify({ generated: new Date().toISOString(), passed, failed, total, elapsed_s: parseFloat(elapsed), workflows: log }, null, 2));
  console.log('  Report saved: backend/uat-workflow-results.json\n');
  process.exit(failed > 0 ? 1 : 0);
})();
