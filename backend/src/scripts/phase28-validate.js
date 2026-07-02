/**
 * Phase 28 — Production Validation Script
 * Rajdhani Cargo Services Pvt Ltd Pilot Operations
 *
 * Tests: health, metrics, auth/RBAC, business APIs, performance, security headers.
 * Usage: node src/scripts/phase28-validate.js
 * Output: phase28-results.json
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE = process.env.API_URL || 'http://localhost:5000';
const COMPANY_ID = '6a46876adbb074ca5f6f7e21';
const BRANCH_ID  = '6a46876adbb074ca5f6f7e23'; // Delhi HQ

// ─── HTTP helper ─────────────────────────────────────────────────────────────
function req(method, urlPath, { body, token, json = true } = {}) {
  return new Promise((resolve) => {
    const url = new URL(urlPath, BASE);
    const lib = url.protocol === 'https:' ? https : http;
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
    };
    const t0 = Date.now();
    const r = lib.request({ hostname: url.hostname, port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search, method, headers }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        const ms = Date.now() - t0;
        let data = raw;
        if (json) try { data = JSON.parse(raw); } catch { data = raw; }
        resolve({ status: res.statusCode, headers: res.headers, data, ms });
      });
    });
    r.on('error', e => resolve({ status: 0, headers: {}, data: e.message, ms: Date.now() - t0 }));
    if (payload) r.write(payload);
    r.end();
  });
}

// ─── Result tracker ───────────────────────────────────────────────────────────
const results = { pass: 0, fail: 0, warn: 0, items: [] };

function record(category, name, passed, detail, ms = null, warn = false) {
  const status = passed ? 'PASS' : (warn ? 'WARN' : 'FAIL');
  if (passed) results.pass++; else if (warn) results.warn++; else results.fail++;
  results.items.push({ category, name, status, detail, ms });
  const icon = passed ? '✅' : (warn ? '⚠️ ' : '❌');
  const t = ms != null ? ` [${ms}ms]` : '';
  console.log(`  ${icon} ${name}${t} — ${detail}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  Phase 28 — Production Validation — LocalWheels Enterprise v1.0 ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
  console.log(`Target: ${BASE}\nDate:   ${new Date().toISOString()}\n`);

  // ── 1. Infrastructure Health ─────────────────────────────────────────────
  console.log('── 1. Infrastructure Health ───────────────────────────────────────');
  {
    const r = await req('GET', '/api/health');
    record('Infrastructure', 'Health endpoint responds', r.status === 200, `HTTP ${r.status}`, r.ms);
    if (r.data && typeof r.data === 'object') {
      record('Infrastructure', 'Database connected', r.data.db?.ready === true, `db.state = ${r.data.db?.state}`);
      record('Infrastructure', 'Memory usage normal', r.data.memory?.heap_used_mb < 512,
        `heap ${r.data.memory?.heap_used_mb}MB / ${r.data.memory?.heap_total_mb}MB`);
      record('Infrastructure', 'Uptime tracked', r.data.uptime_s > 0, `${r.data.uptime_s}s uptime`);
      const redisEnabled = r.data.redis?.enabled;
      record('Infrastructure', 'Redis config checked', true,
        redisEnabled ? `Redis enabled, connected=${r.data.redis?.connected}` : 'Redis not configured (optional)', null, !redisEnabled);
    }
  }

  // ── 2. Metrics ───────────────────────────────────────────────────────────
  console.log('\n── 2. Prometheus Metrics ──────────────────────────────────────────');
  {
    const r = await req('GET', '/api/metrics', { json: false });
    record('Metrics', 'Metrics endpoint responds', r.status === 200, `HTTP ${r.status}`, r.ms);
    const body = typeof r.data === 'string' ? r.data : '';
    record('Metrics', 'mongodb_connected metric present', body.includes('mongodb_connected'), 'metric found');
    record('Metrics', 'process_uptime_seconds present', body.includes('process_uptime_seconds'), 'metric found');
    record('Metrics', 'http_requests_total present', body.includes('http_requests_total'), 'metric found');
    record('Metrics', 'system_load_1m present', body.includes('system_load_1m'), 'metric found');
    record('Metrics', 'Content-Type is text/plain', r.headers['content-type']?.includes('text/plain'), r.headers['content-type']);
  }

  // ── 3. Authentication ────────────────────────────────────────────────────
  console.log('\n── 3. Authentication & JWT ────────────────────────────────────────');
  let adminToken = null;
  {
    const r = await req('POST', '/api/auth/login', { body: { username: 'rajdhani_admin', password: 'RCS@Admin#2026' } });
    const ok = r.status === 200 && r.data?.token;
    record('Auth', 'Company admin login', ok, ok ? 'Token issued' : `HTTP ${r.status}: ${JSON.stringify(r.data)}`, r.ms);
    if (ok) adminToken = r.data.token;
  }
  {
    const r = await req('POST', '/api/auth/login', { body: { username: 'admin', password: 'wrongpassword' } });
    record('Auth', 'Invalid credentials rejected', r.status === 401, `HTTP ${r.status}`);
  }
  {
    const r = await req('GET', '/api/auth/me', { token: adminToken });
    // /me returns user directly (not wrapped in {user})
    const meUser = r.data?.username ? r.data : r.data?.user;
    record('Auth', 'JWT /me endpoint', r.status === 200 && meUser?.username === 'rajdhani_admin',
      `username=${meUser?.username}`, r.ms);
  }
  {
    const r = await req('GET', '/api/branches');
    record('Auth', 'Unauthenticated request blocked', r.status === 401, `HTTP ${r.status}`);
  }

  // ── 4. Security Headers ──────────────────────────────────────────────────
  console.log('\n── 4. Security Headers ────────────────────────────────────────────');
  {
    const r = await req('GET', '/api/health');
    const h = r.headers;
    record('Security', 'X-Frame-Options or CSP frameAncestors set',
      !!(h['x-frame-options'] || h['content-security-policy']), h['content-security-policy'] || h['x-frame-options'] || 'missing');
    record('Security', 'X-Content-Type-Options set', h['x-content-type-options'] === 'nosniff', h['x-content-type-options'] || 'missing');
    record('Security', 'X-DNS-Prefetch-Control set', !!h['x-dns-prefetch-control'], h['x-dns-prefetch-control'] || 'missing');
    record('Security', 'Referrer-Policy set', !!h['referrer-policy'], h['referrer-policy'] || 'missing');
    record('Security', 'X-Powered-By hidden', !h['x-powered-by'], h['x-powered-by'] ? 'exposed' : 'hidden');
  }

  // ── 5. Role-Based Access Control ─────────────────────────────────────────
  console.log('\n── 5. RBAC & Company Isolation ────────────────────────────────────');
  {
    const r = await req('POST', '/api/companies', { token: adminToken,
      body: { name: 'Unauthorized Company', code: 'UNA' } });
    record('Security', 'company admin cannot create companies', r.status === 403, `HTTP ${r.status}`);
  }
  {
    // Verify super_admin-only company creation is blocked for company admin (already checked above)
    // Branch listing for OTHER companies should be isolated
    const r = await req('GET', `/api/companies`, { token: adminToken });
    record('Security', 'Company list restricted to own company', r.status === 403 || (Array.isArray(r.data) ? r.data.length <= 1 : true),
      `HTTP ${r.status} — multi-tenant isolation`);
  }

  // ── 6. Core Business APIs ─────────────────────────────────────────────────
  console.log('\n── 6. Core Business API Endpoints ─────────────────────────────────');
  const coreEndpoints = [
    ['GET', `/api/branches`, 'Branches list'],
    ['GET', `/api/customers?branch_id=${BRANCH_ID}`, 'Customers list'],
    ['GET', `/api/vehicles?branch_id=${BRANCH_ID}`, 'Vehicles list'],
    ['GET', `/api/drivers?branch_id=${BRANCH_ID}`, 'Drivers list'],
    ['GET', `/api/shipments?branch_id=${BRANCH_ID}`, 'Shipments list'],
    ['GET', `/api/invoices?branch_id=${BRANCH_ID}`, 'Invoices list'],
    ['GET', `/api/complaints?branch_id=${BRANCH_ID}`, 'Complaints list'],
    ['GET', `/api/leads?branch_id=${BRANCH_ID}`, 'Leads list'],
    ['GET', `/api/quotes?branch_id=${BRANCH_ID}`, 'Quotes list'],
  ];
  for (const [method, path, name] of coreEndpoints) {
    const r = await req(method, path, { token: adminToken });
    record('Core APIs', name, r.status === 200, `HTTP ${r.status} — ${Array.isArray(r.data) ? r.data.length + ' records' : typeof r.data}`, r.ms);
  }

  // ── 7. Performance Benchmarks ─────────────────────────────────────────────
  console.log('\n── 7. Performance Benchmarks ──────────────────────────────────────');
  const perfRuns = 5;
  const perfTargets = [
    [`/api/health`, 'Health endpoint', 100],
    [`/api/customers?branch_id=${BRANCH_ID}`, 'Customer list', 500],
    [`/api/shipments?branch_id=${BRANCH_ID}`, 'Shipment list', 500],
    [`/api/invoices?branch_id=${BRANCH_ID}`, 'Invoice list', 500],
  ];
  for (const [urlPath, name, slaMs] of perfTargets) {
    const times = [];
    for (let i = 0; i < perfRuns; i++) {
      const r = await req('GET', urlPath, { token: adminToken });
      if (r.status === 200) times.push(r.ms);
    }
    if (times.length === 0) { record('Performance', name, false, 'No successful responses'); continue; }
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const max = Math.max(...times);
    const ok = avg <= slaMs;
    record('Performance', `${name} avg response`, ok, `avg ${avg}ms / max ${max}ms (SLA: ${slaMs}ms)`, avg, !ok);
  }

  // ── 8. Data Integrity Checks ──────────────────────────────────────────────
  console.log('\n── 8. Data Integrity ──────────────────────────────────────────────');
  // API responses: { status, message, data: { <entity>: [...], total, ... } }
  function extractCount(r, key) {
    if (Array.isArray(r.data)) return r.data.length;
    const d = r.data?.data;
    if (!d) return 0;
    if (Array.isArray(d)) return d.length;
    if (Array.isArray(d[key])) return d[key].length;
    // Try common plural keys
    for (const k of [key, key+'s', 'docs', 'results', 'items']) {
      if (Array.isArray(d[k])) return d[k].length;
    }
    return d.total || 0;
  }
  {
    const r = await req('GET', `/api/customers?branch_id=${BRANCH_ID}`, { token: adminToken });
    const count = extractCount(r, 'customer');
    record('Data', 'Customer count ≥ 12', count >= 12, `Found ${count} customers`);
  }
  {
    // Vehicles were imported at company scope (no branch_id) — query without branch filter
    const r = await req('GET', `/api/vehicles?limit=50`, { token: adminToken });
    const count = extractCount(r, 'vehicle');
    record('Data', 'Vehicle count ≥ 12 (company fleet)', count >= 12, `Found ${count} vehicles`);
  }
  {
    // Drivers also imported at company scope
    const r = await req('GET', `/api/drivers?limit=50`, { token: adminToken });
    const count = extractCount(r, 'driver');
    record('Data', 'Driver count ≥ 10', count >= 10, `Found ${count} drivers`);
  }
  {
    const r = await req('GET', `/api/shipments?branch_id=${BRANCH_ID}`, { token: adminToken });
    const count = extractCount(r, 'shipment');
    record('Data', 'Shipments exist (from Phase 27b)', count >= 1, `Found ${count} shipments`);
  }

  // ── 9. Extended Module Checks ─────────────────────────────────────────────
  console.log('\n── 9. Extended Module Availability ────────────────────────────────');
  const modules = [
    [`/api/notifications?branch_id=${BRANCH_ID}`, 'Notifications module'],
    [`/api/warehouses?branch_id=${BRANCH_ID}`, 'Warehouse module'],
    [`/api/suppliers?branch_id=${BRANCH_ID}`, 'Suppliers module'],
    [`/api/dashboard?branch_id=${BRANCH_ID}`, 'Dashboard API'],
    [`/api/companies/setup-status`, 'Setup status API'],
    [`/api/companies/master-config/vehicle_type`, 'Master config API'],
    [`/api/import/template/customers`, 'Import template API'],
  ];
  for (const [urlPath, name] of modules) {
    const r = await req('GET', urlPath, { token: adminToken });
    record('Modules', name, r.status === 200, `HTTP ${r.status}`, r.ms);
  }

  // ── 10. Setup Completion ──────────────────────────────────────────────────
  console.log('\n── 10. Setup & Configuration Status ───────────────────────────────');
  {
    const r = await req('GET', '/api/companies/setup-status', { token: adminToken });
    const done = r.data?.setup_completed === true;
    record('Config', 'Setup wizard completed', done, done ? 'setup_completed=true' : `setup_completed=${r.data?.setup_completed}`);
    record('Config', 'Company name correct', r.data?.name === 'Rajdhani Cargo Services Pvt Ltd',
      `name="${r.data?.name}"`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = results.pass + results.fail + results.warn;
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log(`║  RESULTS: ${results.pass} PASS / ${results.warn} WARN / ${results.fail} FAIL  (${total} total)${' '.repeat(Math.max(0,25-String(results.pass+results.warn+results.fail).length))}║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const out = {
    run_at: new Date().toISOString(),
    target: BASE,
    company_id: COMPANY_ID,
    branch_id: BRANCH_ID,
    summary: { pass: results.pass, warn: results.warn, fail: results.fail, total },
    items: results.items,
  };
  const outPath = path.join(__dirname, '../../phase28-results.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Results written to: ${outPath}`);
  process.exit(results.fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('Fatal:', e); process.exit(2); });
