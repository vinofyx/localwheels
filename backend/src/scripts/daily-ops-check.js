/**
 * LocalWheels Enterprise v1.0 — Daily Operations Health Check
 *
 * Captures all production monitoring metrics defined in the ops spec:
 * API response time, P95 latency, uptime, memory, MongoDB, Redis,
 * auth success rate, business entity counts, request volume breakdown.
 *
 * Usage: node src/scripts/daily-ops-check.js
 * Output: Appends one line to ops-daily-log.jsonl; prints status to stdout.
 * Schedule: Daily at 00:05 IST (23:35 UTC previous day)
 */

require('dotenv').config();
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const os    = require('os');

const BASE      = process.env.API_URL || 'http://localhost:5000';
const OPS_USER  = process.env.OPS_USER || 'rajdhani_admin';
const OPS_PASS  = process.env.OPS_PASS || 'RCS@Admin#2026';
const LOG_FILE  = path.join(__dirname, '../../ops-daily-log.jsonl');
const BRANCH_ID = '6a46876adbb074ca5f6f7e23';

// SLAs (ms)
const SLA = { health: 100, auth: 500, list: 500, dashboard: 2000 };

// ── HTTP helper with P95 (multiple samples) ───────────────────────────────────
async function request(method, urlPath, { body, token } = {}) {
  return new Promise((resolve) => {
    const url     = new URL(urlPath, BASE);
    const lib     = url.protocol === 'https:' ? https : http;
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token   ? { Authorization: `Bearer ${token}` }  : {}),
      ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
    };
    const t0 = Date.now();
    const req = lib.request(
      { hostname: url.hostname, port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search, method, headers },
      (res) => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => {
          const ms = Date.now() - t0;
          let data = raw;
          try { data = JSON.parse(raw); } catch { /* keep raw */ }
          resolve({ status: res.statusCode, data, ms, headers: res.headers });
        });
      }
    );
    req.on('error', e => resolve({ status: 0, data: e.message, ms: Date.now() - t0, headers: {} }));
    if (payload) req.write(payload);
    req.end();
  });
}

// Multiple samples → avg, p95, max
async function benchmark(urlPath, token, samples = 5) {
  const times = [];
  let lastStatus = 0;
  for (let i = 0; i < samples; i++) {
    const r = await request('GET', urlPath, { token });
    lastStatus = r.status;
    if (r.status === 200) times.push(r.ms);
  }
  if (!times.length) return { avg: null, p95: null, max: null, status: lastStatus };
  times.sort((a, b) => a - b);
  const p95idx = Math.min(Math.floor(times.length * 0.95), times.length - 1);
  return {
    avg:    Math.round(times.reduce((s, v) => s + v, 0) / times.length),
    p95:    times[p95idx],
    max:    times[times.length - 1],
    status: lastStatus,
  };
}

// Extract count from paginated or array response
function extractCount(r, key) {
  const d = r?.data;
  if (!d) return 0;
  if (Array.isArray(d)) return d.length;
  if (typeof d === 'object') {
    const inner = d.data || d;
    if (Array.isArray(inner)) return inner.length;
    for (const k of [key, key + 's', 'docs', 'results', 'items']) {
      if (Array.isArray(inner[k])) return inner[k].length;
    }
    return inner.total ?? 0;
  }
  return 0;
}

async function main() {
  const ts   = new Date().toISOString();
  const snap = {
    ts,
    host: os.hostname(),
    pid:  process.pid,
    checks:   {},
    latency:  {},
    p95:      {},
    sla:      {},
    counts:   {},
    system:   {},
    security: {},
    alerts:   [],
  };

  console.log(`\n${'─'.repeat(70)}`);
  console.log(`  LocalWheels Enterprise v1.0 — Daily Ops Check`);
  console.log(`  ${ts}`);
  console.log(`${'─'.repeat(70)}`);

  // ── System metrics (host) ────────────────────────────────────────────────
  const mem  = process.memoryUsage();
  const load = os.loadavg();
  snap.system = {
    node_version: process.version,
    platform:     os.platform(),
    arch:         os.arch(),
    hostname:     os.hostname(),
    os_uptime_h:  Math.round(os.uptime() / 3600),
    free_mem_mb:  Math.round(os.freemem() / 1024 / 1024),
    total_mem_mb: Math.round(os.totalmem() / 1024 / 1024),
    load_1m:      load[0],
    load_5m:      load[1],
    load_15m:     load[2],
    node_heap_mb: Math.round(mem.heapUsed / 1024 / 1024),
    node_rss_mb:  Math.round(mem.rss / 1024 / 1024),
  };

  // ── Auth ─────────────────────────────────────────────────────────────────
  console.log('\n  [AUTH]');
  const loginOk  = await request('POST', '/api/auth/login', { body: { username: OPS_USER, password: OPS_PASS } });
  const loginFail = await request('POST', '/api/auth/login', { body: { username: OPS_USER, password: 'wrong' } });
  snap.checks.auth_success  = loginOk.status === 200 && !!loginOk.data?.token;
  snap.checks.auth_reject   = loginFail.status === 401;
  snap.latency.auth_ms      = loginOk.ms;
  snap.sla.auth             = loginOk.ms <= SLA.auth;
  snap.security.failed_logins_test = loginFail.status === 401 ? 0 : 1;
  const token = loginOk.data?.token || null;
  if (!snap.checks.auth_success) snap.alerts.push('CRITICAL — AUTH_FAIL: login rejected');
  console.log(`    Login:      ${snap.checks.auth_success ? '✅' : '❌'} ${loginOk.ms}ms`);
  console.log(`    Rejection:  ${snap.checks.auth_reject ? '✅' : '❌'} invalid creds → ${loginFail.status}`);

  // ── Infrastructure health ────────────────────────────────────────────────
  console.log('\n  [INFRASTRUCTURE]');
  const healthR = await request('GET', '/api/health');
  snap.checks.api_health   = healthR.status === 200;
  snap.checks.db_connected = healthR.data?.db?.ready === true;
  snap.checks.redis        = healthR.data?.redis?.connected === true;
  snap.latency.health_ms   = healthR.ms;
  snap.sla.health          = healthR.ms <= SLA.health;
  Object.assign(snap.system, {
    app_uptime_s:   healthR.data?.uptime_s ?? 0,
    app_version:    healthR.data?.version  ?? '?',
    heap_used_mb:   healthR.data?.memory?.heap_used_mb  ?? 0,
    heap_total_mb:  healthR.data?.memory?.heap_total_mb ?? 0,
    redis_enabled:  healthR.data?.redis?.enabled ?? false,
    redis_connected: healthR.data?.redis?.connected ?? false,
  });
  if (!snap.checks.db_connected) snap.alerts.push('CRITICAL — DB_DISCONNECTED');
  if (snap.system.heap_used_mb > 400) snap.alerts.push(`HIGH — HEAP_HIGH: ${snap.system.heap_used_mb}MB`);
  console.log(`    Health:     ${snap.checks.api_health ? '✅' : '❌'} HTTP ${healthR.status} [${healthR.ms}ms]`);
  console.log(`    MongoDB:    ${snap.checks.db_connected ? '✅' : '❌'} ${healthR.data?.db?.state}`);
  console.log(`    Redis:      ${snap.checks.redis ? '✅' : '⚪'} ${snap.system.redis_enabled ? 'enabled' : 'not configured'}`);
  console.log(`    Heap:       ${snap.system.heap_used_mb}MB / ${snap.system.heap_total_mb}MB`);
  console.log(`    Uptime:     ${Math.floor(snap.system.app_uptime_s / 3600)}h ${Math.round((snap.system.app_uptime_s % 3600) / 60)}m`);

  // ── Prometheus metrics ────────────────────────────────────────────────────
  console.log('\n  [METRICS]');
  const metricsR = await request('GET', '/api/metrics');
  snap.checks.metrics_endpoint = metricsR.status === 200;
  const mtext = typeof metricsR.data === 'string' ? metricsR.data : '';
  const loadM  = mtext.match(/system_load_1m ([0-9.]+)/);
  snap.system.metrics_load_1m = loadM ? parseFloat(loadM[1]) : 0;
  // Count total HTTP 200 responses served
  const req200matches = [...mtext.matchAll(/http_requests_total[^}]+status="200"[^\n]* (\d+)/g)];
  snap.system.http_200_total = req200matches.reduce((s, m) => s + parseInt(m[1]), 0);
  const req4xx  = [...mtext.matchAll(/http_requests_total[^}]+status="4\d\d"[^\n]* (\d+)/g)];
  const req5xx  = [...mtext.matchAll(/http_requests_total[^}]+status="5\d\d"[^\n]* (\d+)/g)];
  snap.system.http_4xx_total = req4xx.reduce((s, m) => s + parseInt(m[1]), 0);
  snap.system.http_5xx_total = req5xx.reduce((s, m) => s + parseInt(m[1]), 0);
  const totalReqs = snap.system.http_200_total + snap.system.http_4xx_total + snap.system.http_5xx_total;
  snap.system.error_rate_pct = totalReqs > 0
    ? +((snap.system.http_5xx_total / totalReqs) * 100).toFixed(2) : 0;
  if (snap.system.http_5xx_total > 0) snap.alerts.push(`WARN — 5XX_ERRORS: ${snap.system.http_5xx_total} errors`);
  console.log(`    Metrics:    ${snap.checks.metrics_endpoint ? '✅' : '❌'} HTTP ${metricsR.status}`);
  console.log(`    200s:       ${snap.system.http_200_total} | 4xx: ${snap.system.http_4xx_total} | 5xx: ${snap.system.http_5xx_total}`);
  console.log(`    Error rate: ${snap.system.error_rate_pct}%`);

  // ── P95 latency benchmarks ────────────────────────────────────────────────
  if (token) {
    console.log('\n  [LATENCY — 5 samples each]');
    const benchmarks = [
      ['/api/health',                            'health',    'health'],
      [`/api/customers?branch_id=${BRANCH_ID}`,  'customers', 'list'],
      [`/api/shipments?branch_id=${BRANCH_ID}`,  'shipments', 'list'],
      [`/api/invoices?branch_id=${BRANCH_ID}`,   'invoices',  'list'],
      [`/api/vehicles`,                           'vehicles',  'list'],
      [`/api/drivers`,                            'drivers',   'list'],
      [`/api/dashboard?branch_id=${BRANCH_ID}`,  'dashboard', 'dashboard'],
    ];
    for (const [urlPath, key, tier] of benchmarks) {
      const b = await benchmark(urlPath, token);
      snap.latency[`${key}_avg`] = b.avg;
      snap.p95[key]              = b.p95;
      snap.sla[key]              = b.avg != null && b.avg <= SLA[tier];
      snap.checks[`api_${key}`]  = b.status === 200;
      const slaIcon = snap.sla[key] ? '✅' : '⚠️ ';
      const display = b.avg != null ? `avg ${b.avg}ms  p95 ${b.p95}ms  max ${b.max}ms` : 'FAIL';
      console.log(`    ${key.padEnd(12)}: ${slaIcon} ${display} (SLA ${SLA[tier]}ms)`);
      if (!snap.sla[key] && b.avg != null) snap.alerts.push(`WARN — SLA_BREACH: ${key} avg ${b.avg}ms > ${SLA[tier]}ms`);
    }

    // ── Business data counts ───────────────────────────────────────────────
    console.log('\n  [BUSINESS ENTITIES]');
    const entities = [
      [`/api/customers?branch_id=${BRANCH_ID}&limit=100`, 'customers', 'customer'],
      [`/api/vehicles?limit=100`,                          'vehicles',  'vehicle'],
      [`/api/drivers?limit=100`,                           'drivers',   'driver'],
      [`/api/shipments?branch_id=${BRANCH_ID}&limit=100`, 'shipments', 'shipment'],
      [`/api/invoices?branch_id=${BRANCH_ID}&limit=100`,  'invoices',  'invoice'],
      [`/api/complaints?branch_id=${BRANCH_ID}&limit=100`,'complaints','complaint'],
      [`/api/leads?branch_id=${BRANCH_ID}&limit=100`,     'leads',     'lead'],
      [`/api/branches`,                                    'branches',  'branch'],
    ];
    for (const [urlPath, key, singular] of entities) {
      const r = await request('GET', urlPath, { token });
      snap.counts[key] = extractCount(r, singular);
      console.log(`    ${key.padEnd(14)}: ${snap.counts[key]}`);
    }

    // ── Auth /me check ─────────────────────────────────────────────────────
    const meR = await request('GET', '/api/auth/me', { token });
    const meUser = meR.data?.username ? meR.data : meR.data?.user;
    snap.checks.jwt_me = meR.status === 200 && !!meUser?.username;
    snap.security.rbac_company_create_blocked = null;
    const rbacR = await request('POST', '/api/companies', { token, body: { name: 'Test', code: 'TST' } });
    snap.security.rbac_company_create_blocked = rbacR.status === 403;
    if (!snap.security.rbac_company_create_blocked) snap.alerts.push('SECURITY — RBAC_BYPASS on /api/companies');
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const allChecks = Object.values(snap.checks).filter(v => v !== null && typeof v === 'boolean');
  const allSla    = Object.values(snap.sla).filter(v => v !== null && typeof v === 'boolean');
  const status    = snap.alerts.some(a => a.startsWith('CRITICAL')) ? 'RED'
                  : snap.alerts.some(a => a.startsWith('HIGH') || a.startsWith('SECURITY')) ? 'ORANGE'
                  : snap.alerts.length > 0 ? 'YELLOW'
                  : 'GREEN';
  snap.summary = {
    status,
    checks_pass:  allChecks.filter(Boolean).length,
    checks_total: allChecks.length,
    sla_pass:     allSla.filter(Boolean).length,
    sla_total:    allSla.length,
    alerts:       snap.alerts.length,
  };

  const icon = { GREEN: '🟢', YELLOW: '🟡', ORANGE: '🟠', RED: '🔴' }[status];
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`  ${icon} ${status}  |  ${snap.summary.checks_pass}/${snap.summary.checks_total} checks  |  ${snap.summary.sla_pass}/${snap.summary.sla_total} SLAs  |  ${snap.alerts.length} alerts`);
  if (snap.alerts.length) snap.alerts.forEach(a => console.log(`  ⚠️  ${a}`));
  console.log(`${'─'.repeat(70)}\n`);

  fs.appendFileSync(LOG_FILE, JSON.stringify(snap) + '\n', 'utf8');
  console.log(`  Log: ${LOG_FILE}\n`);
  process.exit(status === 'RED' ? 1 : 0);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(2); });
