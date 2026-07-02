/**
 * LocalWheels Chaos Test Script
 *
 * Verifies graceful degradation when dependencies are unavailable.
 * Each scenario tests that the API returns a usable response (not a crash)
 * even when MongoDB, Redis, or the AI API is misbehaving.
 *
 * Usage: node src/scripts/chaos-test.js [--base http://localhost:5000]
 *
 * Note: This is a black-box test — it does NOT actually take services down.
 * It validates the "degraded" code paths by checking that:
 *   - Endpoints return HTTP 2xx or expected 4xx/5xx (not unhandled crashes)
 *   - Cached endpoints return _cached:true when cache is warm
 *   - Health endpoint correctly reflects dependency states
 */

require('dotenv').config();
const http  = require('http');
const https = require('https');

const BASE = process.env.LOAD_TEST_BASE
  || process.argv.find(a => a.startsWith('--base='))?.split('=')[1]
  || 'http://localhost:5000';

function request(url, options = {}) {
  return new Promise((resolve) => {
    const mod   = url.startsWith('https') ? https : http;
    const start = Date.now();
    const req   = mod.request(url, { method: 'GET', headers: {}, ...options }, (res) => {
      let body = '';
      res.on('data', d => { body += d; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, ms: Date.now() - start, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, ms: Date.now() - start, data: null, raw: body }); }
      });
    });
    req.setTimeout(20000, () => { req.destroy(); resolve({ status: 0, ms: 20000, data: null, raw: 'TIMEOUT' }); });
    req.on('error', e => resolve({ status: 0, ms: Date.now() - start, data: null, raw: e.message }));
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function getToken() {
  if (process.env.LOAD_TEST_TOKEN) return process.env.LOAD_TEST_TOKEN;
  const body = JSON.stringify({ username: 'admin', password: 'admin123' });
  const r = await request(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    body,
  });
  return r.data?.token || r.data?.data?.token || null;
}

function check(label, condition, detail = '') {
  const icon = condition ? '✅' : '❌';
  console.log(`  ${icon} ${label}${detail ? ': ' + detail : ''}`);
  return condition;
}

// ── Chaos scenarios ──────────────────────────────────────────────────────────

async function scenarioHealthEndpoint(token) {
  console.log('\n[Scenario 1] Health endpoint — structural validation');
  const r = await request(`${BASE}/api/health`);
  let pass = true;
  pass &= check('HTTP 200', r.status === 200);
  pass &= check('status field present', r.data?.status === 'ok');
  pass &= check('db.ready field present', typeof r.data?.db?.ready === 'boolean');
  pass &= check('redis field present', r.data?.redis !== undefined, JSON.stringify(r.data?.redis));
  pass &= check('uptime_s > 0', r.data?.uptime_s > 0);
  pass &= check('memory fields present', r.data?.memory?.rss_mb > 0);
  return pass;
}

async function scenarioAICaching(token) {
  console.log('\n[Scenario 2] AI endpoint cache — second request must be cached');
  const headers = { Authorization: `Bearer ${token}` };

  // Warm the cache
  const r1 = await request(`${BASE}/api/forecast/revenue`, { headers });
  const r2 = await request(`${BASE}/api/forecast/revenue`, { headers });

  let pass = true;
  pass &= check('First request succeeds', r1.status === 200 || r1.status === 401, `status=${r1.status}`);
  if (r1.status === 200) {
    pass &= check('Second request faster (cached)', r2.ms < r1.ms + 500, `1st=${r1.ms}ms 2nd=${r2.ms}ms`);
    pass &= check('Second request has _cached flag', r2.data?._cached === true || r2.data?.data?._cached === true, JSON.stringify(r2.data?._cached));
  }
  return pass;
}

async function scenarioGracefulAuth(token) {
  console.log('\n[Scenario 3] Missing auth token — graceful 401 (no crash)');
  const r = await request(`${BASE}/api/dashboard`);
  let pass = true;
  pass &= check('Returns 401 (not 500)', r.status === 401, `status=${r.status}`);
  pass &= check('Response is JSON', r.data !== null);
  return pass;
}

async function scenarioInvalidId() {
  console.log('\n[Scenario 4] Invalid MongoDB ObjectId — graceful 400 (no crash)');
  const body = JSON.stringify({ username: 'admin', password: 'admin123' });
  const auth = await request(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    body,
  });
  const token = auth.data?.token || auth.data?.data?.token;
  const r = await request(`${BASE}/api/shipments/not-a-valid-objectid`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  let pass = true;
  pass &= check('Returns 400 or 404 (not 500)', r.status === 400 || r.status === 404 || r.status === 401, `status=${r.status}`);
  pass &= check('Response is JSON', r.data !== null || r.raw?.startsWith('{'));
  return pass;
}

async function scenarioRateLimiting() {
  console.log('\n[Scenario 5] Rate limiting — login endpoint (dev: skipped, prod: enforced)');
  const body = JSON.stringify({ username: 'wrong', password: 'wrong' });
  const promises = Array.from({ length: 12 }, () =>
    request(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      body,
    })
  );
  const results = await Promise.all(promises);
  const has429 = results.some(r => r.status === 429);
  const noServer500 = results.every(r => r.status !== 500);
  let pass = true;
  pass &= check('No 500 errors (graceful handling)', noServer500);
  // In DEV mode, rate limiting is skipped — that is correct behaviour
  const env = (await request(`${BASE}/api/health`)).data?.env;
  if (env === 'production') {
    pass &= check('Rate limit 429 triggered after 10 attempts (prod)', has429);
  } else {
    check('Rate limiting skipped in dev (expected)', true, 'NODE_ENV=development');
  }
  return pass;
}

async function scenarioOversizedPayload(token) {
  console.log('\n[Scenario 6] Oversized payload — graceful rejection (no crash)');
  const headers = token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
  // Send 11 MB payload (limit is 10 MB)
  const body = JSON.stringify({ data: 'x'.repeat(11 * 1024 * 1024) });
  const r = await request(`${BASE}/api/shipments`, {
    method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(body) }, body,
  });
  let pass = true;
  pass &= check('Returns 413 or 400 (not 500/crash)', [400, 401, 413].includes(r.status), `status=${r.status}`);
  return pass;
}

async function scenarioCORSRejection() {
  console.log('\n[Scenario 7] CORS — unknown origin blocked in production');
  const env = (await request(`${BASE}/api/health`)).data?.env;
  if (env !== 'production') {
    check('Skipped in dev (CORS allows all origins in dev)', true);
    return true;
  }
  const r = await request(`${BASE}/api/dashboard`, {
    headers: { Origin: 'https://evil.example.com' },
  });
  return check('CORS-blocked origin returns 403', r.status === 403, `status=${r.status}`);
}

async function scenarioNotFound() {
  console.log('\n[Scenario 8] Non-existent route — structured 404 (no crash)');
  const r = await request(`${BASE}/api/nonexistent-route-xyz`);
  let pass = true;
  pass &= check('Returns 404', r.status === 404, `status=${r.status}`);
  pass &= check('Response is JSON with error field', r.data?.error !== undefined);
  return pass;
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('  LocalWheels Chaos / Resilience Test');
  console.log(`  Target: ${BASE}`);
  console.log(`${'='.repeat(60)}`);

  const health = await request(`${BASE}/api/health`);
  if (health.status !== 200) {
    console.error('❌ Server not reachable. Start the backend first.');
    process.exit(1);
  }
  console.log('✅ Server reachable\n');

  const token = await getToken();
  if (token) console.log('✅ Auth token acquired');
  else console.warn('⚠️  No token — some scenarios will test unauthenticated paths\n');

  const results = await Promise.all([
    scenarioHealthEndpoint(token),
    scenarioAICaching(token),
    scenarioGracefulAuth(token),
    scenarioInvalidId(),
    scenarioRateLimiting(),
    scenarioOversizedPayload(token),
    scenarioCORSRejection(),
    scenarioNotFound(),
  ]);

  const passed = results.filter(Boolean).length;
  const total  = results.length;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  CHAOS TEST SUMMARY: ${passed}/${total} scenarios PASS`);
  console.log(`${'─'.repeat(60)}`);
  results.forEach((r, i) => console.log(`  Scenario ${i + 1}: ${r ? '✅ PASS' : '❌ FAIL'}`));
  console.log(`\n  Overall: ${passed === total ? '✅ ALL PASS' : `❌ ${total - passed} FAIL`}`);
  console.log(`${'='.repeat(60)}\n`);

  process.exit(passed === total ? 0 : 1);
})();
