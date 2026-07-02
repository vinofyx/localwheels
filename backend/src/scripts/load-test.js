/**
 * LocalWheels Load Test Script
 *
 * Usage:
 *   node src/scripts/load-test.js [--users 100] [--base http://localhost:5000]
 *
 * Tests: API response time and error rate under concurrent load.
 * Requires a valid JWT token from LOGIN_TOKEN env var, or attempts auto-login.
 */

require('dotenv').config();
const http  = require('http');
const https = require('https');

// ── Config ─────────────────────────────────────────────────────────────────
const BASE   = process.env.LOAD_TEST_BASE || process.argv.find(a => a.startsWith('--base='))?.split('=')[1] || 'http://localhost:5000';
const USERS  = parseInt(process.argv.find(a => a.startsWith('--users='))?.split('=')[1] || '100', 10);
const ROUNDS = 3;

// ── HTTP helper ─────────────────────────────────────────────────────────────
function request(url, options = {}) {
  return new Promise((resolve) => {
    const mod   = url.startsWith('https') ? https : http;
    const start = Date.now();
    const req   = mod.request(url, { method: 'GET', headers: {}, ...options }, (res) => {
      let body = '';
      res.on('data', d => { body += d; });
      res.on('end', () => resolve({ status: res.statusCode, ms: Date.now() - start, body }));
    });
    req.setTimeout(15000, () => { req.destroy(); resolve({ status: 0, ms: 15000, body: 'TIMEOUT' }); });
    req.on('error', e => resolve({ status: 0, ms: Date.now() - start, body: e.message }));
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ── Auto-login ───────────────────────────────────────────────────────────────
async function getToken() {
  if (process.env.LOAD_TEST_TOKEN) return process.env.LOAD_TEST_TOKEN;
  const body = JSON.stringify({ username: 'admin', password: 'admin123' });
  const r = await request(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    body,
  });
  try {
    const data = JSON.parse(r.body);
    return data.token || data.data?.token || null;
  } catch { return null; }
}

// ── Test endpoints ───────────────────────────────────────────────────────────
const ENDPOINTS = [
  '/api/health',
  '/api/dashboard',
  '/api/shipments',
  '/api/customers',
  '/api/vehicles',
  '/api/drivers',
  '/api/invoices',
  '/api/fleet',
  '/api/reports',
  '/api/forecast/revenue',
  '/api/executive-cockpit/snapshot',
];

// ── Run concurrent load ──────────────────────────────────────────────────────
async function runWave(endpoints, token, concurrency) {
  const tasks = [];
  for (let i = 0; i < concurrency; i++) {
    const ep = endpoints[i % endpoints.length];
    tasks.push(request(`${BASE}${ep}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }));
  }
  return Promise.all(tasks);
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function stats(results) {
  const ms     = results.map(r => r.ms).sort((a, b) => a - b);
  const errors = results.filter(r => r.status === 0 || r.status >= 500).length;
  const p50    = ms[Math.floor(ms.length * 0.50)];
  const p95    = ms[Math.floor(ms.length * 0.95)];
  const p99    = ms[Math.floor(ms.length * 0.99)];
  const avg    = Math.round(ms.reduce((a, b) => a + b, 0) / ms.length);
  return { total: results.length, errors, errorRate: ((errors / results.length) * 100).toFixed(1), avg, p50, p95, p99 };
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  LocalWheels Load Test`);
  console.log(`  Target : ${BASE}`);
  console.log(`  Users  : ${USERS} concurrent`);
  console.log(`  Rounds : ${ROUNDS}`);
  console.log(`${'='.repeat(60)}\n`);

  // Health check first
  const health = await request(`${BASE}/api/health`);
  if (health.status !== 200) {
    console.error('❌ Health check failed — server not reachable. Aborting.');
    process.exit(1);
  }
  console.log('✅ Health check OK\n');

  const token = await getToken();
  if (!token) console.warn('⚠️  No auth token — authenticated endpoints will return 401 (expected)\n');
  else        console.log('✅ Auth token acquired\n');

  const allResults = [];

  for (let round = 1; round <= ROUNDS; round++) {
    process.stdout.write(`Round ${round}/${ROUNDS} (${USERS} concurrent)… `);
    const t0 = Date.now();
    const results = await runWave(ENDPOINTS, token, USERS);
    const elapsed = Date.now() - t0;
    allResults.push(...results);
    const s = stats(results);
    process.stdout.write(`done in ${elapsed}ms — p95=${s.p95}ms errors=${s.errors}/${s.total}\n`);
  }

  const s = stats(allResults);
  const rps = Math.round((allResults.length / (USERS * ROUNDS)) * 1000 / (s.avg || 1));

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  AGGREGATE RESULTS (${USERS} concurrent users × ${ROUNDS} rounds)`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`  Total requests : ${s.total}`);
  console.log(`  Errors         : ${s.errors} (${s.errorRate}%)`);
  console.log(`  Avg latency    : ${s.avg} ms`);
  console.log(`  P50            : ${s.p50} ms`);
  console.log(`  P95            : ${s.p95} ms`);
  console.log(`  P99            : ${s.p99} ms`);
  console.log(`${'─'.repeat(60)}`);

  const pass = s.p95 <= 500 && parseFloat(s.errorRate) <= 1;
  console.log(`\n  SLA: P95 < 500ms AND error rate < 1%`);
  console.log(`  Result: ${pass ? '✅ PASS' : '❌ FAIL'}`);
  if (!pass) {
    if (s.p95 > 500) console.log(`  ⚠️  P95 ${s.p95}ms exceeds 500ms SLA`);
    if (parseFloat(s.errorRate) > 1) console.log(`  ⚠️  Error rate ${s.errorRate}% exceeds 1% SLA`);
  }
  console.log(`\n${'='.repeat(60)}\n`);

  // Machine-readable summary for CI
  const report = { timestamp: new Date().toISOString(), users: USERS, rounds: ROUNDS, ...s, sla_pass: pass };
  console.log('JSON:', JSON.stringify(report));
  process.exit(pass ? 0 : 1);
})();
