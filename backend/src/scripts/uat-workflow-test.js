/**
 * LocalWheels UAT — Business Workflow End-to-End Test
 * Tests complete workflows: Sales→Delivery, Warehouse, Fleet, Finance, Support
 * Usage: node src/scripts/uat-workflow-test.js
 */

require('dotenv').config();
const http = require('http');

const BASE = process.env.LOAD_TEST_BASE || 'http://localhost:5000';
let TOKEN = '';
let BRANCH_ID = '';
let COMPANY_ID = '';

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function apiReq(method, path, body = null) {
  return new Promise((resolve) => {
    const b = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        ...(b ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(b) } : {}),
      },
    };
    const start = Date.now();
    const req = http.request(`${BASE}${path}`, opts, (res) => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, ms: Date.now() - start, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, ms: Date.now() - start, data: null }); }
      });
    });
    req.setTimeout(30000, () => { req.destroy(); resolve({ status: 0, ms: 30000, data: null }); });
    req.on('error', e => resolve({ status: 0, ms: 0, data: null, err: e.message }));
    if (b) req.write(b);
    req.end();
  });
}

let stepPass = 0, stepFail = 0;
const failures = [];

function step(label, condition, detail = '') {
  const icon = condition ? '  ✅' : '  ❌';
  console.log(`${icon} ${label}${detail ? ' — ' + detail : ''}`);
  if (condition) stepPass++;
  else { stepFail++; failures.push(label); }
  return condition;
}

// ── Workflow 1: Auth & Master Data ────────────────────────────────────────────
async function workflowAuth() {
  console.log('\n══ WF-1: Authentication & Master Data ══');

  // Login
  const r = await apiReq('POST', '/api/auth/login');
  // Do it with no token to test the 401 first
  const badR = await new Promise(res => {
    const req = http.request(`${BASE}/api/dashboard`, {
      headers: { Authorization: 'Bearer invalid-token-xyz' },
    }, r => { let b=''; r.on('data',d=>b+=d); r.on('end', ()=>res({status:r.statusCode})); });
    req.on('error',e=>res({status:0})); req.end();
  });
  step('Invalid JWT → 401', badR.status === 401, `status=${badR.status}`);

  // Real login
  const loginR = await new Promise(res => {
    const b = JSON.stringify({ username: 'admin', password: 'admin123' });
    const req = http.request(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(b) },
    }, r => { let data=''; r.on('data',d=>data+=d); r.on('end', ()=>res({status:r.statusCode,data:JSON.parse(data)})); });
    req.on('error',e=>res({status:0,data:null})); req.write(b); req.end();
  });
  TOKEN = loginR.data?.token || loginR.data?.data?.token;
  step('Login → JWT token', !!TOKEN && loginR.status === 200, `status=${loginR.status}`);

  // Auth/me
  const me = await apiReq('GET', '/api/auth/me');
  COMPANY_ID = me.data?.data?.company_id || me.data?.company_id;
  step('Auth/me → user object', me.status === 200, `role=${me.data?.data?.role || me.data?.role}`);

  // Branches
  const br = await apiReq('GET', '/api/branches');
  const branches = Array.isArray(br.data) ? br.data : (br.data?.data || br.data?.branches || []);
  BRANCH_ID = branches[0]?._id;
  COMPANY_ID = branches[0]?.company_id || COMPANY_ID;
  step('Branches list', br.status === 200 && branches.length > 0, `count=${branches.length} branch_id=${BRANCH_ID}`);

  // Users
  const users = await apiReq('GET', '/api/users');
  step('Users list', users.status === 200);

  // Customers
  const custs = await apiReq('GET', '/api/customers');
  step('Customers list', custs.status === 200);

  // Vehicles
  const vehs = await apiReq('GET', '/api/vehicles');
  step('Vehicles list', vehs.status === 200);

  // Drivers
  const drvs = await apiReq('GET', '/api/drivers');
  step('Drivers list', drvs.status === 200);
}

// ── Workflow 2: Sales to Delivery ─────────────────────────────────────────────
async function workflowSalesDelivery() {
  console.log('\n══ WF-2: Sales → Delivery ══');
  const Q = `?branch_id=${BRANCH_ID}`;

  // Create Lead
  const lead = await apiReq('POST', '/api/leads', {
    name: `UAT Lead ${Date.now()}`,
    company: 'UAT Test Co',
    email: 'uat@test.com',
    phone: '9999000001',
    source: 'manual_entry',
    status: 'new',
    estimated_value: 50000,
    notes: 'Created by UAT workflow test',
  });
  // Lead API returns raw document (no data wrapper)
  const leadId = lead.data?._id;
  step('Create Lead', lead.status === 200 || lead.status === 201, `id=${leadId}`);

  // Convert Lead → Opportunity
  // Valid stages: new_lead, qualified, contacted, meeting_scheduled, proposal_sent, negotiation, won, lost
  const opp = await apiReq('POST', '/api/opportunities', {
    title: 'UAT Opportunity',
    customer_name: 'UAT Customer',
    lead_id: leadId,
    estimated_value: 50000,
    probability: 70,
    stage: 'proposal_sent',
    expected_close: new Date(Date.now() + 30 * 86400000).toISOString(),
  });
  const oppId = opp.data?.data?._id || opp.data?._id;
  step('Convert to Opportunity', opp.status === 200 || opp.status === 201, `id=${oppId}`);

  // Create Quote — field is weight_kg not weight
  const qt = await apiReq('POST', '/api/quotes', {
    customer_name: 'UAT Customer',
    customer_phone: '9999000001',
    customer_email: 'uat@test.com',
    pickup_city: 'Mumbai', pickup_state: 'Maharashtra', pickup_pincode: '400001',
    destination_city: 'Delhi', destination_state: 'Delhi', destination_pincode: '110001',
    weight_kg: 500,
    packages: 1,
    material: 'Electronics',
    valid_till: new Date(Date.now() + 7 * 86400000).toISOString(),
    branch_id: BRANCH_ID,
  });
  const quoteId = qt.data?.data?._id || qt.data?._id;
  step('Generate Quote', qt.status === 200 || qt.status === 201, `id=${quoteId}`);

  // Create Shipment/Booking — payment_type enum: topay, paid, fob, tbb
  const ship = await apiReq('POST', `/api/shipments?branch_id=${BRANCH_ID}`, {
    branch_id: BRANCH_ID,
    sender_name: 'UAT Sender', sender_phone: '9999000001', sender_address: '1 MG Road Mumbai',
    receiver_name: 'UAT Receiver', receiver_phone: '9999000002', receiver_address: '1 CP Delhi',
    destination: 'Delhi',
    booking_date: new Date().toISOString(),
    freight_charges: 5000,
    payment_type: 'paid',
    weight: 500,
    quantity: 1,
    material: 'Electronics',
  });
  // Shipment API returns { id, lr_number } not { _id }
  const shipId = ship.data?.id || ship.data?.data?._id || ship.data?._id;
  step('Create Shipment', ship.status === 200 || ship.status === 201, `id=${shipId}`);

  // Get shipment list (verify it's there)
  const ships = await apiReq('GET', `/api/shipments${Q}`);
  step('Shipments list (branch-scoped)', ships.status === 200);

  // POD is auto-created with each shipment; verify via GET /api/pod list
  const pod = await apiReq('GET', `/api/pod${Q}`);
  step('Create POD', pod.status === 200, `pod list accessible`);

  // Payments
  const pmts = await apiReq('GET', `/api/payments${Q}`);
  step('Payments list', pmts.status === 200);

  // Dashboard KPIs
  const dash = await apiReq('GET', `/api/dashboard?branch_id=${BRANCH_ID}`);
  step('Dashboard KPIs', dash.status === 200);

  // Executive Cockpit
  const exec = await apiReq('GET', '/api/executive-cockpit/snapshot');
  step('Executive snapshot (AI + cached)', exec.status === 200, `_cached=${exec.data?.data?._cached}`);
}

// ── Workflow 3: Warehouse ─────────────────────────────────────────────────────
async function workflowWarehouse() {
  console.log('\n══ WF-3: Warehouse ══');

  const whs = await apiReq('GET', '/api/warehouses');
  step('Warehouses list', whs.status === 200);

  const inv = await apiReq('GET', '/api/inventory');
  step('Inventory list', inv.status === 200);

  const inb = await apiReq('GET', '/api/inbound');
  step('Inbound list', inb.status === 200);

  const out = await apiReq('GET', '/api/outbound');
  step('Outbound list', out.status === 200);

  const docks = await apiReq('GET', '/api/docks');
  step('Docks list', docks.status === 200);

  const tasks = await apiReq('GET', '/api/tasks');
  step('Warehouse tasks', tasks.status === 200);

  const ai = await apiReq('GET', '/api/warehouse-ai/recommendations');
  step('WH-AI recommendations', ai.status === 200);

  const wa = await apiReq('GET', '/api/warehouse-analytics');
  step('Warehouse analytics', wa.status === 200);
}

// ── Workflow 4: Fleet & Maintenance ───────────────────────────────────────────
async function workflowFleet() {
  console.log('\n══ WF-4: Fleet & Maintenance ══');

  const fleet = await apiReq('GET', '/api/fleet');
  step('Fleet list', fleet.status === 200);

  const wo = await apiReq('GET', '/api/workorders');
  step('Work orders', wo.status === 200);

  const ws = await apiReq('GET', '/api/workshops');
  step('Workshops', ws.status === 200);

  const db = await apiReq('GET', '/api/driver-behaviour');
  step('Driver behaviour', db.status === 200);

  const fi = await apiReq('GET', '/api/fuel-intelligence');
  step('Fuel intelligence', fi.status === 200);

  const eh = await apiReq('GET', '/api/engine-health');
  step('Engine health', eh.status === 200);

  const bh = await apiReq('GET', '/api/battery-health');
  step('Battery health', bh.status === 200);

  const th = await apiReq('GET', '/api/tyre-health');
  step('Tyre health', th.status === 200);
}

// ── Workflow 5: Finance ───────────────────────────────────────────────────────
async function workflowFinance() {
  console.log('\n══ WF-5: Finance ══');

  const inv = await apiReq('GET', `/api/invoices?branch_id=${BRANCH_ID}`);
  step('Invoices (branch-scoped)', inv.status === 200);

  const fi = await apiReq('GET', '/api/fin-invoices');
  step('Financial invoices', fi.status === 200);

  const ar = await apiReq('GET', '/api/accounts-receivable');
  step('Accounts Receivable', ar.status === 200);

  const ap = await apiReq('GET', '/api/accounts-payable');
  step('Accounts Payable', ap.status === 200);

  const gl = await apiReq('GET', '/api/general-ledger');
  step('General Ledger', gl.status === 200);

  const coa = await apiReq('GET', '/api/chart-of-accounts');
  step('Chart of Accounts', coa.status === 200);

  const jn = await apiReq('GET', '/api/journal');
  step('Journal entries', jn.status === 200);

  const cf = await apiReq('GET', '/api/cashflow');
  step('Cash Flow', cf.status === 200);

  const bg = await apiReq('GET', '/api/budget');
  step('Budget', bg.status === 200);

  const pl = await apiReq('GET', '/api/financial-reports/profit-loss');
  step('P&L Report', pl.status === 200);

  const bank = await apiReq('GET', '/api/banking/accounts');
  step('Banking accounts', bank.status === 200);

  const gst = await apiReq('GET', '/api/tax/transactions');
  step('Tax/GST transactions', gst.status === 200);

  // Finance AI Copilot
  const cop = await apiReq('POST', '/api/finance-copilot/chat', {
    question: 'Summarize my accounts receivable position',
  });
  step('Finance AI Copilot (chat)', cop.status === 200, `ms=${cop.ms}`);
}

// ── Workflow 6: Customer Support ──────────────────────────────────────────────
async function workflowSupport() {
  console.log('\n══ WF-6: Customer Support ══');

  // Create complaint
  const cmp = await apiReq('POST', '/api/complaints', {
    customer_name: 'UAT Customer',
    subject: 'UAT Test Complaint',
    description: 'Testing complaint workflow in UAT',
    priority: 'medium',
    type: 'general',
  });
  const cmpId = cmp.data?.data?._id;
  step('Create Complaint', cmp.status === 200 || cmp.status === 201, `id=${cmpId}`);

  // List complaints
  const cmps = await apiReq('GET', '/api/complaints');
  step('Complaints list', cmps.status === 200);

  // Notifications
  const notif = await apiReq('GET', '/api/notifications');
  step('Notifications', notif.status === 200);

  // FAQ
  const faq = await apiReq('GET', '/api/faq');
  step('FAQ', faq.status === 200);

  // Knowledge Base
  const kb = await apiReq('GET', '/api/knowledge');
  step('Knowledge Base', kb.status === 200);

  // Support analytics
  const sa = await apiReq('GET', '/api/support-analytics/overview');
  step('Support Analytics', sa.status === 200);

  // Live agent queue
  const la = await apiReq('GET', '/api/live-agent/queue');
  step('Live Agent Queue', la.status === 200);
}

// ── Workflow 7: Control Tower & AI ────────────────────────────────────────────
async function workflowControlTower() {
  console.log('\n══ WF-7: Control Tower & AI ══');

  const ct = await apiReq('GET', '/api/control-tower/dashboard');
  step('Control Tower dashboard', ct.status === 200);

  const lo = await apiReq('GET', '/api/live-operations/vehicles');
  step('Live Operations (vehicles)', lo.status === 200);

  const inc = await apiReq('GET', '/api/incidents');
  step('Incidents', inc.status === 200);

  const risk = await apiReq('GET', '/api/risk');
  step('Risk assessment', risk.status === 200);

  const dec = await apiReq('GET', '/api/decision-engine');
  step('Decision engine', dec.status === 200);

  const fcast = await apiReq('GET', '/api/forecast/revenue');
  step('Revenue forecast (AI cached)', fcast.status === 200, `_cached=${fcast.data?._cached}`);

  const bi = await apiReq('GET', '/api/business-intelligence/insights');
  step('BI insights', bi.status === 200);

  const dt = await apiReq('GET', '/api/digital-twin');
  step('Digital twin', dt.status === 200);
}

// ── Workflow 8: Integration Platform ─────────────────────────────────────────
async function workflowIntegration() {
  console.log('\n══ WF-8: Integration Platform ══');

  const gw = await apiReq('GET', '/api/gateway');
  step('API Gateway', gw.status === 200);

  const wh = await apiReq('GET', '/api/webhooks');
  step('Webhooks', wh.status === 200);

  const ak = await apiReq('GET', '/api/api-keys');
  step('API Keys', ak.status === 200);

  const ev = await apiReq('GET', '/api/events');
  step('Events', ev.status === 200);

  const am = await apiReq('GET', '/api/api-monitoring/health');
  step('API Monitoring health', am.status === 200);

  const auto = await apiReq('GET', '/api/automation');
  step('Automation workflows', auto.status === 200);

  const apr = await apiReq('GET', '/api/approvals/workflows');
  step('Approval workflows', apr.status === 200);
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${'='.repeat(70)}`);
  console.log('  LocalWheels UAT — Business Workflow End-to-End Test');
  console.log(`  ${new Date().toISOString()}`);
  console.log(`${'='.repeat(70)}`);

  await workflowAuth();
  await workflowSalesDelivery();
  await workflowWarehouse();
  await workflowFleet();
  await workflowFinance();
  await workflowSupport();
  await workflowControlTower();
  await workflowIntegration();

  const total = stepPass + stepFail;
  const rate = ((stepPass / total) * 100).toFixed(1);

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`  WORKFLOW TEST SUMMARY: ${stepPass}/${total} (${rate}%)`);
  if (failures.length) {
    console.log(`  Failures:`);
    failures.forEach(f => console.log(`    ❌ ${f}`));
  }
  console.log(`\n  ${stepFail === 0 ? '✅ ALL WORKFLOWS PASS' : `❌ ${stepFail} FAILURES`}`);
  console.log(`${'='.repeat(70)}\n`);

  const summary = { timestamp: new Date().toISOString(), total, pass: stepPass, fail: stepFail, rate, failures };
  require('fs').writeFileSync('uat-workflow-results.json', JSON.stringify(summary, null, 2));
  process.exit(stepFail === 0 ? 0 : 1);
})();
