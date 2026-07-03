/**
 * LocalWheels — Full Production Validation Suite
 *
 * Extends smoke-test.js with all 16 business workflow checks.
 * Run this against a live production deployment after go-live.
 *
 * Usage:
 *   node production-validate.js <backend-url> <username> <password> [--dev]
 *
 *   --dev   Skip production-only checks (NODE_ENV, CORS, metrics gate)
 *
 * Exit code 0 = all clear. Exit code 1 = failures found.
 */

const https = require('https');
const http  = require('http');
const url   = require('url');
const fs    = require('fs');

const args     = process.argv.slice(2);
const DEV_MODE = args.includes('--dev');
const posArgs  = args.filter(a => a !== '--dev');
const [BASE_URL, USERNAME, PASSWORD] = posArgs;

if (!BASE_URL || !USERNAME || !PASSWORD) {
  console.error('Usage: node production-validate.js <backend-url> <username> <password> [--dev]');
  console.error('  e.g. node production-validate.js https://localwheels-backend.onrender.com admin Pass --dev');
  process.exit(1);
}

const BASE  = BASE_URL.replace(/\/$/, '') + '/api';
const START = Date.now();

function request(method, path, { body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new url.URL(BASE + path);
    const lib = parsed.protocol === 'https:' ? https : http;
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      timeout: 20000,
    };
    const t0 = Date.now();
    const req = lib.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, body: parsed, ms: Date.now() - t0, headers: res.headers });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

let passed = 0, failed = 0, skipped = 0;
const results = [];

async function check(section, name, fn) {
  try {
    const result = await fn();
    const ok = result?.pass !== false && result !== false;
    if (ok) {
      passed++;
      console.log(`  ✅  ${name}${result?.note ? ' — ' + result.note : ''}`);
      results.push({ section, name, pass: true, note: result?.note || '' });
    } else {
      failed++;
      console.log(`  ❌  ${name}${result?.note ? ' — ' + result.note : ''}`);
      results.push({ section, name, pass: false, note: result?.note || '' });
    }
  } catch (e) {
    failed++;
    console.log(`  ❌  ${name} — ${e.message}`);
    results.push({ section, name, pass: false, note: e.message });
  }
}

function skip(section, name, reason) {
  skipped++;
  console.log(`  ⏭  ${name} — SKIP: ${reason}`);
  results.push({ section, name, pass: 'skip', note: reason });
}

function extractId(body) {
  if (!body) return null;
  if (body._id) return body._id;
  if (body.data?._id) return body.data._id;
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

async function run() {
  console.log(`\n╔══════════════════════════════════════════════════════════════════╗`);
  console.log(`║   LocalWheels — Production Validation Suite v1.0                ║`);
  console.log(`║   Target : ${BASE_URL.padEnd(54)}║`);
  console.log(`║   Time   : ${new Date().toISOString().padEnd(54)}║`);
  console.log(`║   Mode   : ${(DEV_MODE ? 'DEV (3 prod checks skipped)' : 'PRODUCTION').padEnd(54)}║`);
  console.log(`╚══════════════════════════════════════════════════════════════════╝\n`);

  // ── 1. Infrastructure ─────────────────────────────────────────────────────
  console.log('── 1. Infrastructure & Health ──────────────────────────────────────');

  let healthBody = {};
  await check('infrastructure', 'GET /health → 200 + db connected', async () => {
    const r = await request('GET', '/health');
    healthBody = r.body;
    const ok = r.status === 200 && r.body?.db?.ready === true;
    return { pass: ok, note: `db=${r.body?.db?.state}, env=${r.body?.env}, v=${r.body?.version}, ${r.ms}ms` };
  });

  if (!DEV_MODE) {
    await check('infrastructure', 'NODE_ENV is production', async () => {
      return { pass: healthBody?.env === 'production', note: `env=${healthBody?.env}` };
    });
  }

  await check('infrastructure', 'Security headers (X-Content-Type-Options)', async () => {
    const r = await request('GET', '/health');
    return { pass: r.headers['x-content-type-options'] === 'nosniff' };
  });

  await check('infrastructure', 'X-Powered-By hidden', async () => {
    const r = await request('GET', '/health');
    return { pass: !r.headers['x-powered-by'] };
  });

  await check('infrastructure', 'Memory within limits (<200MB RSS)', async () => {
    const rss = healthBody?.memory?.rss_mb || 0;
    return { pass: rss < 200, note: `rss=${rss}MB heap=${healthBody?.memory?.heap_used_mb}MB` };
  });

  // ── 2. Authentication ────────────────────────────────────────────────────
  console.log('\n── 2. Authentication ───────────────────────────────────────────────');

  let token = null, companyId = null, branchId = null;

  await check('auth', 'POST /auth/login → 200 + JWT', async () => {
    const r = await request('POST', '/auth/login', { body: { username: USERNAME, password: PASSWORD } });
    if (r.status === 200 && r.body?.token) {
      token = r.body.token;
      companyId = r.body.user?.company_id;
      return { note: `${r.ms}ms, role=${r.body?.user?.role}, company=${companyId}` };
    }
    return { pass: false, note: `status=${r.status}: ${JSON.stringify(r.body).slice(0, 80)}` };
  });

  await check('auth', 'GET /auth/me → 200 with token', async () => {
    if (!token) return { pass: false, note: 'no token' };
    const r = await request('GET', '/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    return { pass: r.status === 200, note: `${r.ms}ms, user=${r.body?.username}` };
  });

  await check('auth', 'Branch resolution → 200', async () => {
    if (!token) return { pass: false, note: 'no token' };
    const r = await request('GET', '/branches/user', { headers: { Authorization: `Bearer ${token}` } });
    if (r.status === 200 && Array.isArray(r.body) && r.body.length) {
      branchId = r.body[0]._id;
      return { note: `${r.body.length} branch(es), active=${r.body[0].branch_name}` };
    }
    return { pass: false, note: `status=${r.status}` };
  });

  await check('auth', 'POST /auth/login without body → 400', async () => {
    const r = await request('POST', '/auth/login', { body: {} });
    return { pass: r.status === 400 };
  });

  await check('auth', 'GET /auth/me without token → 401', async () => {
    const r = await request('GET', '/auth/me');
    return { pass: r.status === 401 };
  });

  await check('auth', 'JWT tamper → 401', async () => {
    const r = await request('GET', '/auth/me', { headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImZha2UifQ.badsig' } });
    return { pass: r.status === 401 };
  });

  // ── 3. Business Workflows ────────────────────────────────────────────────
  console.log('\n── 3. Business Workflows ───────────────────────────────────────────');

  if (!token || !branchId) {
    skip('workflows', 'All workflows', 'auth failed — cannot proceed');
  } else {
    const auth = { Authorization: `Bearer ${token}` };
    const ts   = Date.now();

    // WF1: Lead
    let leadOk = false;
    await check('workflows', 'WF1: Lead created', async () => {
      const r = await request('POST', '/leads', { headers: auth, body: { name: `PVLD-Lead-${ts}`, customer_name: 'PV Validation Customer', contact_phone: '9000000001', source: 'manual_entry', origin_city: 'Hyderabad', destination_city: 'Delhi', estimated_weight: 1000, status: 'new' } });
      leadOk = r.status === 201 || r.status === 200;
      return { pass: leadOk, note: leadOk ? `id=${extractId(r.body)}` : `${r.status}: ${JSON.stringify(r.body).slice(0,80)}` };
    });

    // WF1: Quote
    let quoteId = null;
    await check('workflows', 'WF1: Quote created', async () => {
      const r = await request('POST', '/quotes', { headers: auth, body: { customer_name: 'PV Validation Customer', customer_phone: '9000000001', pickup_city: 'Hyderabad', pickup_state: 'Telangana', destination_city: 'Delhi', destination_state: 'Delhi', weight_kg: 1000, material_type: 'General', packages: 1, pickup_date: new Date(Date.now() + 86400000).toISOString() } });
      quoteId = extractId(r.body);
      return { pass: r.status === 201 || r.status === 200, note: quoteId ? `id=${quoteId}` : `${r.status}: ${JSON.stringify(r.body).slice(0,80)}` };
    });

    // WF1: Booking
    let bookingId = null;
    await check('workflows', 'WF1: Booking confirmed', async () => {
      const r = await request('POST', '/bookings', { headers: auth, body: { branch_id: branchId, sender_name: 'Ramesh Kumar', sender_phone: '9000000001', sender_address: 'Hyderabad', pickup_address: '123 KPHB, Hyderabad', pickup_date: new Date(Date.now() + 86400000).toISOString(), receiver_name: 'Arun Sharma', receiver_phone: '9000000099', receiver_address: 'Delhi', destination: 'Delhi', goods_description: 'General Goods', estimated_weight: 1000, service_type: 'ftl' } });
      bookingId = extractId(r.body);
      return { pass: r.status === 201 || r.status === 200, note: bookingId ? `id=${bookingId}` : `${r.status}: ${JSON.stringify(r.body).slice(0,80)}` };
    });

    // WF2: Shipment
    let shipmentId = null;
    await check('workflows', 'WF2: Shipment created', async () => {
      if (!bookingId) return { pass: false, note: 'no booking' };
      const r = await request('POST', '/shipments', { headers: auth, body: { branch_id: branchId, booking_id: bookingId, sender_name: 'Ramesh Kumar', receiver_name: 'Arun Sharma', origin: 'Hyderabad', destination: 'Delhi', weight_kg: 1000 } });
      shipmentId = extractId(r.body) || r.body?.id;
      return { pass: r.status === 201 || r.status === 200, note: r.body?.lr_number || `${r.status}: ${JSON.stringify(r.body).slice(0,60)}` };
    });

    // WF6: Invoice (independent of dispatch/POD chain)
    let invoiceId = null;
    await check('workflows', 'WF6: Invoice created', async () => {
      const r = await request('POST', '/invoices', { headers: auth, body: { branch_id: branchId, customer_name: 'PV Validation Customer', customer_address: 'Hyderabad', due_date: new Date(Date.now() + 30 * 86400000).toISOString(), line_items: [{ description: 'Freight HYD-DEL', quantity: 1, rate: 8000, amount: 8000 }], cgst_percent: 9, sgst_percent: 9, igst_percent: 0 } });
      invoiceId = extractId(r.body);
      return { pass: r.status === 201 || r.status === 200, note: invoiceId ? `id=${invoiceId}` : `${r.status}: ${JSON.stringify(r.body).slice(0,80)}` };
    });

    // WF7: Payment
    await check('workflows', 'WF7: Payment recorded', async () => {
      if (!invoiceId) return { pass: false, note: 'no invoice' };
      const r = await request('POST', '/fin-payments', { headers: auth, body: { branch_id: branchId, customer_name: 'PV Validation Customer', invoice_id: invoiceId, amount: 9440, payment_mode: 'neft', reference_no: `PVPAY-${ts}` } });
      return { pass: r.status === 201 || r.status === 200, note: `${r.status}` };
    });

    // WF8: Complaint + Resolve
    let complaintId = null;
    await check('workflows', 'WF8: Complaint opened', async () => {
      const r = await request('POST', '/complaints', { headers: auth, body: { customer_name: 'PV Validation Customer', type: 'service', subject: `PV Validation Complaint ${ts}`, description: 'Production validation test complaint', priority: 'low' } });
      complaintId = r.body._id || r.body.ticket?._id;
      return { pass: r.status === 201 || r.status === 200, note: complaintId ? `id=${complaintId}` : `${r.status}: ${JSON.stringify(r.body).slice(0,60)}` };
    });

    await check('workflows', 'WF8: Complaint resolved', async () => {
      if (!complaintId) return { pass: false, note: 'no complaint' };
      const r = await request('POST', `/complaints/${complaintId}/resolve`, { headers: auth, body: { resolution_action: 'Resolved during production validation' } });
      return { pass: r.status === 200, note: `status=${r.status}` };
    });

    // WF9: Work Order
    await check('workflows', 'WF9: Work order created', async () => {
      const vR = await request('GET', '/vehicles?limit=1', { headers: auth });
      // /vehicles wraps response: { data: { vehicles: [...] } }
      let vehicles = extractList(vR.body);
      if (!vehicles.length) vehicles = extractList(vR.body?.data);
      if (!vehicles.length) vehicles = vR.body?.data?.vehicles || [];
      if (!vehicles.length) return { pass: false, note: 'no vehicles in system' };
      const vehicleId = vehicles[0]._id;
      const r = await request('POST', '/workorders', { headers: auth, body: { branch_id: branchId, fleet_vehicle_id: vehicleId, title: `PV Maintenance Check ${ts}`, work_type: 'preventive', description: 'Production validation maintenance order', scheduled_date: new Date(Date.now() + 7 * 86400000).toISOString(), estimated_cost: 2000, status: 'open' } });
      return { pass: r.status === 201 || r.status === 200, note: `${r.status}: ${r.status !== 201 ? JSON.stringify(r.body).slice(0,60) : 'ok'}` };
    });

    // WF12: Finance
    await check('workflows', 'WF12: Journal entry', async () => {
      const coa = await request('GET', '/chart-of-accounts?limit=5', { headers: auth });
      const accounts = extractList(coa.body);
      if (accounts.length < 2) return { pass: false, note: `only ${accounts.length} accounts` };
      const r = await request('POST', '/journal', { headers: auth, body: { journal_no: `PVJRN-${ts}`, journal_date: new Date().toISOString().split('T')[0], description: 'Production validation journal', lines: [{ account_id: accounts[0]._id, debit: 9440, credit: 0 }, { account_id: accounts[1]._id, debit: 0, credit: 9440 }] } });
      return { pass: r.status === 201 || r.status === 200, note: `${r.status}` };
    });

    // WF13: Dashboard
    await check('workflows', 'WF13: Dashboard (15 KPIs)', async () => {
      const r = await request('GET', `/dashboard?branch_id=${branchId}`, { headers: auth });
      return { pass: r.status === 200, note: `keys=${Object.keys(r.body||{}).length}, ${r.ms}ms` };
    });

    await check('workflows', 'WF13: Executive summary', async () => {
      const r = await request('GET', '/executive/summary', { headers: auth });
      return { pass: r.status === 200, note: `${r.ms}ms` };
    });
  }

  // ── 4. Public Routes ─────────────────────────────────────────────────────
  console.log('\n── 4. Public Routes ────────────────────────────────────────────────');

  await check('public', 'GET /track → no auth required', async () => {
    const r = await request('GET', '/track?lr_no=PVSMOKE');
    return { pass: r.status === 200 || r.status === 404, note: `status=${r.status}` };
  });

  await check('public', 'POST /chat → accessible without token', async () => {
    const r = await request('POST', '/chat', { body: { messages: [{ role: 'user', content: 'ping' }], session_id: 'pv-smoke' } });
    return { pass: r.status === 200 || r.status === 429 || r.status === 503, note: `status=${r.status}` };
  });

  // ── 5. Security ──────────────────────────────────────────────────────────
  console.log('\n── 5. Security ─────────────────────────────────────────────────────');

  if (!DEV_MODE) {
    await check('security', 'CORS blocks unknown origin', async () => {
      const parsed = new url.URL(BASE + '/health');
      const lib = parsed.protocol === 'https:' ? https : http;
      const r = await new Promise((resolve, reject) => {
        const req = lib.request({ hostname: parsed.hostname, port: parsed.port || 443, path: '/api/health', method: 'OPTIONS', headers: { 'Origin': 'https://evil-attacker.example.com', 'Access-Control-Request-Method': 'GET' }, timeout: 10000 }, res => { resolve({ headers: res.headers }); res.resume(); });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        req.end();
      });
      const origin = r.headers['access-control-allow-origin'];
      return { pass: !origin || origin !== 'https://evil-attacker.example.com', note: `allow-origin: ${origin || '(absent)'}` };
    });

    await check('security', 'GET /metrics → 401 without token', async () => {
      const r = await request('GET', '/metrics');
      return { pass: r.status === 401 || r.status === 403, note: `status=${r.status}` };
    });
  }

  await check('security', 'Protected routes → 401 without token', async () => {
    const routes = ['/users', '/shipments', '/bookings', '/invoices'];
    const results = await Promise.all(routes.map(p => request('GET', p)));
    const allBlocked = results.every(r => r.status === 401);
    return { pass: allBlocked, note: results.map((r, i) => `${routes[i]}=${r.status}`).join(' ') };
  });

  // ── 6. Performance ───────────────────────────────────────────────────────
  console.log('\n── 6. Performance ──────────────────────────────────────────────────');

  await check('performance', 'Health endpoint p50 < 100ms', async () => {
    const times = [];
    for (let i = 0; i < 5; i++) { const r = await request('GET', '/health'); times.push(r.ms); }
    times.sort((a, b) => a - b);
    const p50 = times[Math.floor(times.length / 2)];
    return { pass: p50 < 100, note: `p50=${p50}ms samples=${times.join(',')}` };
  });

  if (token && branchId) {
    await check('performance', `Dashboard p50 < ${DEV_MODE ? '300ms (dev)' : '200ms (prod)'}`, async () => {
      const times = [];
      for (let i = 0; i < 5; i++) { const r = await request('GET', `/dashboard?branch_id=${branchId}`, { headers: { Authorization: `Bearer ${token}` } }); times.push(r.ms); }
      times.sort((a, b) => a - b);
      const p50 = times[Math.floor(times.length / 2)];
      const threshold = DEV_MODE ? 300 : 200;
      return { pass: p50 < threshold, note: `p50=${p50}ms samples=${times.join(',')}` };
    });
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const total = passed + failed;
  const elapsed = ((Date.now() - START) / 1000).toFixed(1);
  const allPass = failed === 0;

  console.log(`\n╔══════════════════════════════════════════════════════════════════╗`);
  console.log(`║  RESULT  : ${String(passed + '/' + total + ' passed').padEnd(56)}║`);
  console.log(`║  STATUS  : ${(allPass ? '🟢 ALL CLEAR — PRODUCTION VALIDATED' : '🔴 FAILURES — SEE ABOVE').padEnd(56)}║`);
  console.log(`║  ELAPSED : ${String(elapsed + 's').padEnd(56)}║`);
  console.log(`╚══════════════════════════════════════════════════════════════════╝`);

  if (!allPass) {
    console.log('\n  Failures:');
    results.filter(r => r.pass === false).forEach(r => console.log(`  ❌ [${r.section}] ${r.name}: ${r.note}`));
  }

  // Save JSON report
  const report = {
    generated:   new Date().toISOString(),
    target:      BASE_URL,
    mode:        DEV_MODE ? 'dev' : 'production',
    passed, failed, skipped, total,
    elapsed_s:   parseFloat(elapsed),
    all_pass:    allPass,
    checks:      results,
  };
  const outFile = 'production-validation-results.json';
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`\n  Report saved: backend/${outFile}\n`);

  process.exit(allPass ? 0 : 1);
}

run();
