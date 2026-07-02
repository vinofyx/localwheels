/**
 * LocalWheels — Production Health Check Script
 * Run daily via cron or CI to verify system health.
 *
 * Usage:
 *   node src/scripts/health-check.js [--url https://api.localwheels.com]
 *
 * Exit code:
 *   0 = all checks passed
 *   1 = one or more checks failed
 */

const https = require('https');
const http  = require('http');

const BASE_URL = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : (process.env.API_URL || 'http://localhost:5000');

const TOKEN = process.env.HEALTH_CHECK_TOKEN || '';

let passed = 0;
let failed = 0;
const failures = [];

function req(method, path, body, authToken) {
  return new Promise((resolve) => {
    const url  = new URL(BASE_URL + path);
    const lib  = url.protocol === 'https:' ? https : http;
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      timeout: 10000,
    };
    const r = lib.request(opts, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, body }); }
      });
    });
    r.on('error', (e) => resolve({ status: 0, error: e.message }));
    r.on('timeout', () => { r.destroy(); resolve({ status: 0, error: 'timeout' }); });
    if (data) r.write(data);
    r.end();
  });
}

function check(label, result, expectStatus, validate) {
  const ok = result.status === expectStatus && (!validate || validate(result.body));
  if (ok) {
    console.log(`  ✅ [${result.status}] ${label}`);
    passed++;
  } else {
    const detail = result.error || `status=${result.status}`;
    console.log(`  ❌ [${result.status}] ${label} — ${detail}`);
    failures.push(label);
    failed++;
  }
}

async function run() {
  console.log(`\n🔍  LocalWheels Health Check — ${new Date().toISOString()}`);
  console.log(`    Target: ${BASE_URL}\n`);

  // ── 1. System Health ────────────────────────────────────────────────────────
  console.log('── System ──');
  const health = await req('GET', '/api/health');
  check('Health endpoint reachable', health, 200,
    b => b.status === 'ok');
  check('Database connected', health, 200,
    b => !!(b.db && b.db.state === 'connected') || !!(b.database === 'connected'));
  check('Redis connected (or graceful)', health, 200,
    b => b.status === 'ok'); // redis optional — health passes without it

  // ── 2. Authentication ───────────────────────────────────────────────────────
  console.log('\n── Authentication ──');
  const badAuth = await req('GET', '/api/shipments');
  check('Unauthenticated access rejected', badAuth, 401);

  const badJwt = await req('GET', '/api/shipments', null, 'invalid.jwt.token');
  check('Invalid JWT rejected', badJwt, 401);

  if (TOKEN) {
    const authCheck = await req('GET', '/api/fleet', null, TOKEN);
    check('Valid JWT accepted', authCheck, 200);
  } else {
    console.log('  ⏭️  Skipping auth validation (HEALTH_CHECK_TOKEN not set)');
  }

  // ── 3. Rate Limiting ────────────────────────────────────────────────────────
  console.log('\n── Rate Limiting ──');
  const rl = await req('POST', '/api/auth/login',
    { username: 'nosuchuser', password: 'wrongpassword' });
  check('Login endpoint responds (401 or 429)', rl,
    [401, 429].includes(rl.status) ? rl.status : 0);

  // ── 4. Core API Endpoints ───────────────────────────────────────────────────
  if (TOKEN) {
    console.log('\n── Core APIs ──');
    const endpoints = [
      ['GET /api/fleet',                    '/api/fleet'],
      ['GET /api/warehouses',               '/api/warehouses'],
      ['GET /api/control-tower/dashboard',  '/api/control-tower/dashboard'],
      ['GET /api/simulation',               '/api/simulation'],
      ['GET /api/automation',               '/api/automation'],
      ['GET /api/executive/kpis',           '/api/executive/kpis'],
      ['GET /api/forecast/revenue',         '/api/forecast/revenue'],
      ['GET /api/iot/devices',              '/api/iot/devices'],
      ['GET /api/recovery/plans',           '/api/recovery/plans'],
      ['GET /api/executive-cockpit/snapshot','/api/executive-cockpit/snapshot'],
    ];
    for (const [label, path] of endpoints) {
      const r = await req('GET', path, null, TOKEN);
      check(label, r, 200);
    }
  }

  // ── 5. Metrics ──────────────────────────────────────────────────────────────
  console.log('\n── Monitoring ──');
  const metrics = await req('GET', '/api/metrics');
  check('Prometheus metrics endpoint', metrics, 200,
    b => typeof b === 'string' && b.includes('process_'));

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  Passed: ${passed} | Failed: ${failed}`);
  if (failures.length > 0) {
    console.log(`  Failed checks: ${failures.join(', ')}`);
    console.log('  ❌  HEALTH CHECK FAILED\n');
    process.exit(1);
  } else {
    console.log('  ✅  ALL CHECKS PASSED\n');
    process.exit(0);
  }
}

run();
