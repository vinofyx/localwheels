/**
 * auth-e2e-test.js — End-to-end authentication test suite
 *
 * Tests all authentication scenarios without an active Clerk session.
 * Clerk-exchange scenarios require a real Clerk session token and are
 * documented but skipped in the automated run.
 *
 * Usage:
 *   node backend/src/scripts/auth-e2e-test.js
 *
 * Prerequisites: backend must be running on PORT (default 5000).
 */

require('dotenv').config();
const https = require('http');

const BASE = `http://localhost:${process.env.PORT || 5000}/api`;
const ADMIN_USER = { username: 'rajdhani_admin', password: 'RCS@Admin#2026' };
const SUPER_USER = { username: 'superadmin', password: 'LW@SuperAdmin#2026!' };

let passed = 0;
let failed = 0;
const results = [];

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: url.hostname,
      port:     url.port || 80,
      path:     url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers,
      },
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function check(name, passed_, detail = '') {
  const icon = passed_ ? '✅' : '❌';
  const entry = `${icon} ${name}${detail ? ' — ' + detail : ''}`;
  results.push(entry);
  console.log('  ' + entry);
  if (passed_) passed++; else failed++;
}

async function run() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  LocalWheels Authentication — End-to-End Test Suite');
  console.log('═══════════════════════════════════════════════════════════\n');

  let adminToken = null;

  // ── 1. Username / password login ──────────────────────────────────────────
  console.log('1. Username / Password Login');

  {
    const r = await request('POST', '/auth/login', ADMIN_USER);
    const ok = r.status === 200 && r.body.token && r.body.user;
    check('Valid credentials → 200 + token', ok, `status=${r.status}`);
    if (ok) adminToken = r.body.token;
  }

  {
    const r = await request('POST', '/auth/login', { username: 'nobody', password: 'wrong' });
    check('Wrong credentials → 401', r.status === 401, `status=${r.status}`);
  }

  {
    const r = await request('POST', '/auth/login', {});
    check('Missing body → 400', r.status === 400, `status=${r.status}`);
  }

  {
    const r = await request('POST', '/auth/login', { username: '', password: '' });
    check('Empty credentials → 400', r.status === 400, `status=${r.status}`);
  }

  // ── 2. Session persistence — /auth/me ─────────────────────────────────────
  console.log('\n2. Session Persistence — /auth/me');

  {
    const r = await request('GET', '/auth/me', null, { Authorization: `Bearer ${adminToken}` });
    check('Valid JWT → 200 + user', r.status === 200 && r.body.username, `status=${r.status}`);
  }

  {
    const r = await request('GET', '/auth/me');
    check('No token → 401', r.status === 401, `status=${r.status}`);
  }

  {
    const r = await request('GET', '/auth/me', null, { Authorization: 'Bearer invalid.jwt.token' });
    check('Invalid JWT → 401', r.status === 401, `status=${r.status}`);
  }

  {
    const fakeExpired = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      Buffer.from(JSON.stringify({ id: 'x', exp: 1 })).toString('base64') + '.fake';
    const r = await request('GET', '/auth/me', null, { Authorization: `Bearer ${fakeExpired}` });
    check('Expired JWT → 401', r.status === 401, `status=${r.status}`);
  }

  // ── 3. RBAC — Role-based access control ───────────────────────────────────
  console.log('\n3. RBAC — Role-Based Access Control');

  {
    const r = await request('GET', '/companies', null, { Authorization: `Bearer ${adminToken}` });
    // company admin trying to list all companies — should be 403 (requires super_admin role)
    check('Company admin on GET /companies → 403', r.status === 403, `status=${r.status}`);
  }

  {
    const r = await request('GET', '/shipments', null, { Authorization: `Bearer ${adminToken}` });
    // admin on GET /shipments without branch_id — should be 400 (branch_id required)
    check('Admin on GET /shipments without branch_id → 400', r.status === 400, `status=${r.status}`);
  }

  {
    // unauthenticated request to a protected route
    const r = await request('GET', '/shipments');
    check('Unauthenticated on GET /shipments → 401', r.status === 401, `status=${r.status}`);
  }

  {
    // superadmin should be able to list all companies
    let superToken = null;
    const loginR = await request('POST', '/auth/login', SUPER_USER);
    if (loginR.status === 200) superToken = loginR.body.token;
    const r = await request('GET', '/companies', null, { Authorization: `Bearer ${superToken}` });
    check('Superadmin on GET /companies → 200', r.status === 200, `status=${r.status}`);
  }

  // ── 4. Clerk token exchange — without valid token ─────────────────────────
  console.log('\n4. Clerk Exchange — Invalid Token Handling');

  {
    const r = await request('POST', '/auth/clerk-exchange', {});
    check('No Authorization header → 401', r.status === 401, `status=${r.status}`);
  }

  {
    const r = await request('POST', '/auth/clerk-exchange', {}, { Authorization: 'Bearer fake_clerk_token' });
    check('Invalid Clerk token → 401', r.status === 401, `status=${r.status}`);
  }

  // ── 5. Health check ───────────────────────────────────────────────────────
  console.log('\n5. Infrastructure');

  {
    const r = await request('GET', '/health');
    check('GET /api/health → 200', r.status === 200, `db=${r.body?.db?.state}`);
  }

  {
    const r = await request('GET', '/metrics');
    check('GET /api/metrics → 200', r.status === 200, `content-type=text`);
  }

  // ── 6. Clerk-only account — password login rejected ───────────────────────
  console.log('\n6. Clerk-Only Account Protection');
  console.log('  ⚪ SKIP — requires a real Clerk-created user in DB');
  console.log('     Manual test: create user via Clerk, then try POST /auth/login → expect 401');
  console.log('     with "This account uses Clerk authentication"');

  // ── 7. Summary ────────────────────────────────────────────────────────────
  const total = passed + failed;
  const pct = total ? Math.round((passed / total) * 100) : 0;
  const status = failed === 0 ? '🟢 ALL PASS' : `🔴 ${failed} FAILED`;

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  ${status}  —  ${passed}/${total} passed (${pct}%)`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal error running auth tests:', err.message);
  process.exit(1);
});
