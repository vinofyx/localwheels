/**
 * LocalWheels UAT — Complete API Audit (v2 — branch-aware, correct sub-paths)
 * Usage: node src/scripts/uat-api-audit.js
 */

require('dotenv').config();
const http  = require('http');
const https = require('https');

const BASE = process.env.LOAD_TEST_BASE || 'http://localhost:5000';

function req(url, opts = {}) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const start = Date.now();
    const r = mod.request(url, { method: 'GET', headers: {}, ...opts }, (res) => {
      let body = '';
      res.on('data', d => { body += d; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, ms: Date.now() - start, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, ms: Date.now() - start, data: null }); }
      });
    });
    r.setTimeout(15000, () => { r.destroy(); resolve({ status: 0, ms: 15000, data: null }); });
    r.on('error', e => resolve({ status: 0, ms: 0, data: null, err: e.message }));
    if (opts.body) r.write(opts.body);
    r.end();
  });
}

async function post(url, body, headers = {}) {
  const b = JSON.stringify(body);
  return req(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(b), ...headers },
    body: b,
  });
}

// ── Build endpoint list with correct sub-paths ──────────────────────────────
function buildEndpoints(bid) {
  const Q = `?branch_id=${bid}`;
  return [
    // ── CORE ────────────────────────────────────────────────────────────────
    { phase: 'CORE', label: 'Health',           method: 'GET',  path: '/api/health',              auth: false },
    { phase: 'CORE', label: 'Metrics',          method: 'GET',  path: '/api/metrics',             auth: false },
    { phase: 'CORE', label: 'Auth/me',          method: 'GET',  path: '/api/auth/me',             auth: true  },
    { phase: 'CORE', label: 'Dashboard',        method: 'GET',  path: `/api/dashboard${Q}`,       auth: true  },
    { phase: 'CORE', label: 'Branches',         method: 'GET',  path: '/api/branches',            auth: true  },
    { phase: 'CORE', label: 'Users',            method: 'GET',  path: '/api/users',               auth: true  },
    { phase: 'CORE', label: 'Shipments',        method: 'GET',  path: `/api/shipments${Q}`,       auth: true  },
    { phase: 'CORE', label: 'POD',              method: 'GET',  path: `/api/pod${Q}`,             auth: true  },
    { phase: 'CORE', label: 'Payments',         method: 'GET',  path: `/api/payments${Q}`,        auth: true  },

    // ── Ph1 Support ─────────────────────────────────────────────────────────
    { phase: 'Ph1',  label: 'Complaints',       method: 'GET',  path: '/api/complaints',          auth: true  },
    { phase: 'Ph1',  label: 'Notifications',    method: 'GET',  path: '/api/notifications',       auth: true  },
    { phase: 'Ph1',  label: 'FAQ',              method: 'GET',  path: '/api/faq',                 auth: true  },
    { phase: 'Ph1',  label: 'LiveAgent/queue',  method: 'GET',  path: '/api/live-agent/queue',    auth: true  },
    { phase: 'Ph1',  label: 'SupportAnalytics', method: 'GET',  path: '/api/support-analytics/overview', auth: true },
    { phase: 'Ph1',  label: 'Knowledge',        method: 'GET',  path: '/api/knowledge',           auth: true  },

    // ── Ph2 Tracking ────────────────────────────────────────────────────────
    { phase: 'Ph2',  label: 'Tracking/search',  method: 'GET',  path: '/api/tracking/search?value=LR001&type=lr', auth: false, accept404: true },
    { phase: 'Ph2',  label: 'Customers',        method: 'GET',  path: '/api/customers',           auth: true  },
    { phase: 'Ph2',  label: 'Bookings',         method: 'GET',  path: `/api/bookings${Q}`,        auth: true  },

    // ── Ph3 Quotes ──────────────────────────────────────────────────────────
    { phase: 'Ph3',  label: 'Quotes',           method: 'GET',  path: '/api/quotes',              auth: true  },
    { phase: 'Ph3',  label: 'Routes/live-map',  method: 'GET',  path: '/api/routes/live-map',     auth: true  },

    // ── Ph4 Route AI ────────────────────────────────────────────────────────
    { phase: 'Ph4',  label: 'AI/dashboard',     method: 'GET',  path: '/api/ai/dashboard',        auth: true  },

    // ── Ph5 Fleet ───────────────────────────────────────────────────────────
    { phase: 'Ph5',  label: 'Fleet',            method: 'GET',  path: '/api/fleet',               auth: true  },
    { phase: 'Ph5',  label: 'Vehicles',         method: 'GET',  path: '/api/vehicles',            auth: true  },
    { phase: 'Ph5',  label: 'Drivers',          method: 'GET',  path: '/api/drivers',             auth: true  },

    // ── Ph6 Dispatch ────────────────────────────────────────────────────────
    { phase: 'Ph6',  label: 'Dispatch/queue',   method: 'GET',  path: '/api/dispatch/queue',      auth: true  },

    // ── Ph8 Voice ───────────────────────────────────────────────────────────
    { phase: 'Ph8',  label: 'Voice/history',    method: 'GET',  path: '/api/voice/history',       auth: true  },
    { phase: 'Ph8',  label: 'Voice/analytics',  method: 'GET',  path: '/api/voice/analytics',     auth: true  },

    // ── Ph9 CRM ─────────────────────────────────────────────────────────────
    { phase: 'Ph9',  label: 'Leads',            method: 'GET',  path: '/api/leads',               auth: true  },
    { phase: 'Ph9',  label: 'Opportunities',    method: 'GET',  path: '/api/opportunities',       auth: true  },
    { phase: 'Ph9',  label: 'Sales/dashboard',  method: 'GET',  path: '/api/sales/dashboard',     auth: true  },

    // ── Ph10 Driver ─────────────────────────────────────────────────────────
    { phase: 'Ph10', label: 'Driver/dashboard', method: 'GET',  path: '/api/driver/dashboard',    auth: true  },
    { phase: 'Ph10', label: 'Driver/trips',     method: 'GET',  path: '/api/driver/trips',        auth: true  },

    // ── Ph11 Documents ──────────────────────────────────────────────────────
    { phase: 'Ph11', label: 'Documents',        method: 'GET',  path: '/api/documents',           auth: true  },
    { phase: 'Ph11', label: 'OCR/jobs',         method: 'GET',  path: '/api/ocr/jobs',            auth: true  },
    { phase: 'Ph11', label: 'Doc-validation',   method: 'GET',  path: '/api/document-validation', auth: true  },
    { phase: 'Ph11', label: 'Doc-analytics',    method: 'GET',  path: '/api/document-analytics/summary', auth: true },

    // ── Ph12 BI ─────────────────────────────────────────────────────────────
    { phase: 'Ph12', label: 'Executive/kpis',   method: 'GET',  path: '/api/executive/kpis',      auth: true  },
    { phase: 'Ph12', label: 'BI/insights',      method: 'GET',  path: '/api/business-intelligence/insights', auth: true },
    { phase: 'Ph12', label: 'Forecast/revenue', method: 'GET',  path: '/api/forecast/revenue',    auth: true  },
    { phase: 'Ph12', label: 'Alerts',           method: 'GET',  path: '/api/alerts',              auth: true  },
    { phase: 'Ph12', label: 'Reports',          method: 'GET',  path: '/api/reports',             auth: true  },

    // ── Ph13 Maintenance ────────────────────────────────────────────────────
    { phase: 'Ph13', label: 'Workshops',        method: 'GET',  path: '/api/workshops',           auth: true  },
    { phase: 'Ph13', label: 'Workorders',       method: 'GET',  path: '/api/workorders',          auth: true  },
    { phase: 'Ph13', label: 'Driver-behaviour', method: 'GET',  path: '/api/driver-behaviour',    auth: true  },
    { phase: 'Ph13', label: 'Fuel-intelligence',method: 'GET',  path: '/api/fuel-intelligence',   auth: true  },
    { phase: 'Ph13', label: 'Engine-health',    method: 'GET',  path: '/api/engine-health',       auth: true  },
    { phase: 'Ph13', label: 'Battery-health',   method: 'GET',  path: '/api/battery-health',      auth: true  },
    { phase: 'Ph13', label: 'Tyre-health',      method: 'GET',  path: '/api/tyre-health',         auth: true  },

    // ── Ph14 Warehouse ──────────────────────────────────────────────────────
    { phase: 'Ph14', label: 'Warehouses',       method: 'GET',  path: '/api/warehouses',          auth: true  },
    { phase: 'Ph14', label: 'Inventory',        method: 'GET',  path: '/api/inventory',           auth: true  },
    { phase: 'Ph14', label: 'Inbound',          method: 'GET',  path: '/api/inbound',             auth: true  },
    { phase: 'Ph14', label: 'Outbound',         method: 'GET',  path: '/api/outbound',            auth: true  },
    { phase: 'Ph14', label: 'Docks',            method: 'GET',  path: '/api/docks',               auth: true  },
    { phase: 'Ph14', label: 'Tasks',            method: 'GET',  path: '/api/tasks',               auth: true  },
    { phase: 'Ph14', label: 'Warehouse-AI',     method: 'GET',  path: '/api/warehouse-ai/recommendations', auth: true },
    { phase: 'Ph14', label: 'Barcode/lookup',   method: 'GET',  path: '/api/barcode/lookup/TEST123',      auth: true },
    { phase: 'Ph14', label: 'WH-Analytics',     method: 'GET',  path: '/api/warehouse-analytics', auth: true  },

    // ── Ph15 Control Tower ──────────────────────────────────────────────────
    { phase: 'Ph15', label: 'ControlTower',     method: 'GET',  path: '/api/control-tower/dashboard', auth: true },
    { phase: 'Ph15', label: 'Suppliers',        method: 'GET',  path: '/api/suppliers',           auth: true  },
    { phase: 'Ph15', label: 'PurchaseOrders',   method: 'GET',  path: '/api/purchase-orders',     auth: true  },
    { phase: 'Ph15', label: 'SalesOrders',      method: 'GET',  path: '/api/sales-orders',        auth: true  },
    { phase: 'Ph15', label: 'Incidents',        method: 'GET',  path: '/api/incidents',           auth: true  },
    { phase: 'Ph15', label: 'Collaboration',    method: 'GET',  path: '/api/collaboration/rooms', auth: true  },
    { phase: 'Ph15', label: 'Risk',             method: 'GET',  path: '/api/risk',                auth: true  },
    { phase: 'Ph15', label: 'Decision-engine',  method: 'GET',  path: '/api/decision-engine',     auth: true  },
    { phase: 'Ph15', label: 'Live-operations',  method: 'GET',  path: '/api/live-operations/vehicles', auth: true },
    { phase: 'Ph15', label: 'Exec-cockpit',     method: 'GET',  path: '/api/executive-cockpit/snapshot', auth: true },

    // ── Ph16 Automation ─────────────────────────────────────────────────────
    { phase: 'Ph16', label: 'Automation',       method: 'GET',  path: '/api/automation',          auth: true  },
    { phase: 'Ph16', label: 'AutoJobs',         method: 'GET',  path: '/api/automation-jobs',     auth: true  },
    { phase: 'Ph16', label: 'Approvals',        method: 'GET',  path: '/api/approvals/workflows', auth: true  },
    { phase: 'Ph16', label: 'DigitalWorkers',   method: 'GET',  path: '/api/digital-workers',     auth: true  },
    { phase: 'Ph16', label: 'Scheduler',        method: 'GET',  path: '/api/scheduler',           auth: true  },
    { phase: 'Ph16', label: 'Auto-Analytics',   method: 'GET',  path: '/api/automation-analytics/dashboard', auth: true },

    // ── Ph17 Integration ────────────────────────────────────────────────────
    { phase: 'Ph17', label: 'Gateway',          method: 'GET',  path: '/api/gateway',             auth: true  },
    { phase: 'Ph17', label: 'API-Keys',         method: 'GET',  path: '/api/api-keys',            auth: true  },
    { phase: 'Ph17', label: 'Webhooks',         method: 'GET',  path: '/api/webhooks',            auth: true  },
    { phase: 'Ph17', label: 'Connectors',       method: 'GET',  path: '/api/connectors',          auth: true  },
    { phase: 'Ph17', label: 'Events',           method: 'GET',  path: '/api/events',              auth: true  },
    { phase: 'Ph17', label: 'Integrations',     method: 'GET',  path: '/api/integrations/dashboard', auth: true },
    { phase: 'Ph17', label: 'Integ-Analytics',  method: 'GET',  path: '/api/integration-analytics/dashboard', auth: true },
    { phase: 'Ph17', label: 'API-Monitoring',   method: 'GET',  path: '/api/api-monitoring/health', auth: true },

    // ── Ph18 Digital Twin ───────────────────────────────────────────────────
    { phase: 'Ph18', label: 'DigitalTwin',      method: 'GET',  path: '/api/digital-twin',        auth: true  },
    { phase: 'Ph18', label: 'Simulation',       method: 'GET',  path: '/api/simulation',          auth: true  },
    { phase: 'Ph18', label: 'Scenarios',        method: 'GET',  path: '/api/scenarios',           auth: true  },
    { phase: 'Ph18', label: 'Autonomous',       method: 'GET',  path: '/api/autonomous',          auth: true  },
    { phase: 'Ph18', label: 'Capacity',         method: 'GET',  path: '/api/capacity',            auth: true  },
    { phase: 'Ph18', label: 'Demand',           method: 'GET',  path: '/api/demand',              auth: true  },
    { phase: 'Ph18', label: 'Carbon',           method: 'GET',  path: '/api/carbon',              auth: true  },
    { phase: 'Ph18', label: 'Sustainability',   method: 'GET',  path: '/api/sustainability',      auth: true  },
    { phase: 'Ph18', label: 'RiskSim',          method: 'GET',  path: '/api/risk-simulation',     auth: true  },
    { phase: 'Ph18', label: 'Recovery/plans',   method: 'GET',  path: '/api/recovery/plans',      auth: true  },

    // ── Ph19 Finance ────────────────────────────────────────────────────────
    { phase: 'Ph19', label: 'Invoices',         method: 'GET',  path: `/api/invoices${Q}`,        auth: true  },
    { phase: 'Ph19', label: 'Fin-Invoices',     method: 'GET',  path: '/api/fin-invoices',        auth: true  },
    { phase: 'Ph19', label: 'Fin-Payments',     method: 'GET',  path: '/api/fin-payments',        auth: true  },
    { phase: 'Ph19', label: 'AR',               method: 'GET',  path: '/api/accounts-receivable', auth: true  },
    { phase: 'Ph19', label: 'AP',               method: 'GET',  path: '/api/accounts-payable',    auth: true  },
    { phase: 'Ph19', label: 'GeneralLedger',    method: 'GET',  path: '/api/general-ledger',      auth: true  },
    { phase: 'Ph19', label: 'ChartOfAccounts',  method: 'GET',  path: '/api/chart-of-accounts',   auth: true  },
    { phase: 'Ph19', label: 'Journal',          method: 'GET',  path: '/api/journal',             auth: true  },
    { phase: 'Ph19', label: 'Expenses',         method: 'GET',  path: '/api/expenses',            auth: true  },
    { phase: 'Ph19', label: 'Banking/accounts', method: 'GET',  path: '/api/banking/accounts',    auth: true  },
    { phase: 'Ph19', label: 'Reconciliation',   method: 'GET',  path: '/api/reconciliation',      auth: true  },
    { phase: 'Ph19', label: 'Cashflow',         method: 'GET',  path: '/api/cashflow',            auth: true  },
    { phase: 'Ph19', label: 'Budget',           method: 'GET',  path: '/api/budget',              auth: true  },
    { phase: 'Ph19', label: 'CostCenters',      method: 'GET',  path: '/api/cost-centers',        auth: true  },
    { phase: 'Ph19', label: 'Tax/transactions', method: 'GET',  path: '/api/tax/transactions',    auth: true  },
    { phase: 'Ph19', label: 'Fin-Reports P&L',  method: 'GET',  path: '/api/financial-reports/profit-loss', auth: true },
    { phase: 'Ph19', label: 'Fin-Analytics',    method: 'GET',  path: '/api/finance-analytics/dashboard', auth: true },
    { phase: 'Ph19', label: 'Finance-Copilot',  method: 'POST', path: '/api/finance-copilot/chat', auth: true, body: {question:'What is my cash flow summary?'} },

    // ── Security checks ─────────────────────────────────────────────────────
    { phase: 'SEC',  label: 'No-token 401',     method: 'GET',  path: '/api/dashboard',           auth: false, expectBlocked: true },
    { phase: 'SEC',  label: 'No-token ship',    method: 'GET',  path: '/api/shipments',           auth: false, expectBlocked: true },
    { phase: 'SEC',  label: '404 structure',    method: 'GET',  path: '/api/nonexistent-xyz',     auth: false, expect404: true },
  ];
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${'='.repeat(72)}`);
  console.log('  LocalWheels UAT — Complete API Audit');
  console.log(`  Target: ${BASE} | ${new Date().toISOString()}`);
  console.log(`${'='.repeat(72)}\n`);

  const health = await req(`${BASE}/api/health`);
  if (health.status !== 200) { console.error('❌ Server not reachable'); process.exit(1); }
  console.log(`✅ Health: DB=${health.data?.db?.state} Redis=${health.data?.redis?.connected}\n`);

  // Login
  const loginR = await post(`${BASE}/api/auth/login`, { username: 'admin', password: 'admin123' });
  const token = loginR.data?.token || loginR.data?.data?.token;
  if (!token) { console.error('❌ Login failed'); process.exit(1); }
  console.log('✅ Auth OK\n');

  // Get first branch
  const branchesR = await req(`${BASE}/api/branches`, { headers: { Authorization: `Bearer ${token}` } });
  const branches = branchesR.data?.data || branchesR.data || [];
  const bid = (Array.isArray(branches) ? branches[0] : branches?.branches?.[0])?._id;
  console.log(`✅ Branch ID: ${bid}\n`);

  const endpoints = buildEndpoints(bid);
  const authHeaders = { Authorization: `Bearer ${token}` };

  let totalPass = 0, totalFail = 0;
  const failList = [];
  let currentPhase = '';

  for (const ep of endpoints) {
    if (ep.phase !== currentPhase) {
      if (currentPhase) console.log('');
      currentPhase = ep.phase;
      process.stdout.write(`  [${ep.phase}]\n`);
    }

    const reqOpts = { method: ep.method, headers: { ...(ep.auth ? authHeaders : {}) } };
    if (ep.body) {
      const b = JSON.stringify(ep.body);
      reqOpts.headers['Content-Type'] = 'application/json';
      reqOpts.headers['Content-Length'] = Buffer.byteLength(b);
      reqOpts.body = b;
    }
    const r = await req(`${BASE}${ep.path}`, reqOpts);

    let pass;
    if (ep.expectBlocked) pass = r.status === 401 || r.status === 403;
    else if (ep.expect404) pass = r.status === 404;
    else if (ep.accept404) pass = r.status === 200 || r.status === 201 || r.status === 404;
    else pass = r.status === 200 || r.status === 201;

    const icon = pass ? '✅' : '❌';
    process.stdout.write(`    ${icon} ${(ep.label).padEnd(20)} ${String(r.status).padStart(3)} ${r.ms}ms\n`);

    if (pass) totalPass++;
    else { totalFail++; failList.push({ ...ep, status: r.status, ms: r.ms }); }
  }

  const total = totalPass + totalFail;
  const rate = ((totalPass / total) * 100).toFixed(1);
  console.log(`\n${'─'.repeat(72)}`);
  console.log(`  TOTAL: ${totalPass}/${total} (${rate}%)`);

  if (failList.length) {
    console.log(`\n  FAILURES:`);
    failList.forEach(f => console.log(`    ❌ [${f.phase}] ${f.label}: ${f.path} → ${f.status}`));
  }

  console.log(`\n  ${totalFail === 0 ? '✅ ALL PASS' : `❌ ${totalFail} FAIL`}`);
  console.log(`${'='.repeat(72)}\n`);

  const summary = { timestamp: new Date().toISOString(), total, pass: totalPass, fail: totalFail, rate, failures: failList };
  require('fs').writeFileSync('uat-api-results.json', JSON.stringify(summary, null, 2));
  console.log('Results → uat-api-results.json');
  process.exit(totalFail === 0 ? 0 : 1);
})();
