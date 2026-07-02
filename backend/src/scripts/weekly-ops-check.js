/**
 * LocalWheels Enterprise v1.0 — Weekly Operations Health Check
 *
 * Captures: health, metrics, API availability, response times, data counts.
 * Appends to ops-log.jsonl (one JSON line per run).
 *
 * Usage: node src/scripts/weekly-ops-check.js
 * Schedule: run weekly (Sunday 00:00 IST) or on-demand
 */

require('dotenv').config();
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const BASE       = process.env.API_URL || 'http://localhost:5000';
const ADMIN_USER = process.env.OPS_USER || 'rajdhani_admin';
const ADMIN_PASS = process.env.OPS_PASS || 'RCS@Admin#2026';
const LOG_FILE   = path.join(__dirname, '../../ops-log.jsonl');
const BRANCH_ID  = '6a46876adbb074ca5f6f7e23';

// SLA thresholds (ms)
const SLA = { health: 100, list: 500, dashboard: 2000, auth: 500 };

function request(method, urlPath, { body, token } = {}) {
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

async function run() {
  const ts   = new Date().toISOString();
  const snap = { ts, checks: {}, metrics: {}, counts: {}, sla: {}, alerts: [] };

  // ── Auth ─────────────────────────────────────────────────────────────────
  const loginR = await request('POST', '/api/auth/login',
    { body: { username: ADMIN_USER, password: ADMIN_PASS } });
  snap.checks.auth = loginR.status === 200;
  snap.metrics.auth_ms = loginR.ms;
  snap.sla.auth = loginR.ms <= SLA.auth;
  if (!snap.checks.auth) snap.alerts.push('AUTH_FAIL — login rejected');
  const token = loginR.data?.token || null;

  // ── Health ────────────────────────────────────────────────────────────────
  const healthR = await request('GET', '/api/health');
  snap.checks.health  = healthR.status === 200;
  snap.checks.db      = healthR.data?.db?.ready === true;
  snap.checks.redis   = healthR.data?.redis?.connected === true;
  snap.metrics.uptime_s    = healthR.data?.uptime_s  ?? 0;
  snap.metrics.heap_used_mb = healthR.data?.memory?.heap_used_mb ?? 0;
  snap.metrics.heap_total_mb = healthR.data?.memory?.heap_total_mb ?? 0;
  snap.metrics.health_ms   = healthR.ms;
  snap.sla.health = healthR.ms <= SLA.health;
  if (!snap.checks.db)     snap.alerts.push('DB_DISCONNECTED');
  if (snap.metrics.heap_used_mb > 400) snap.alerts.push(`HIGH_HEAP — ${snap.metrics.heap_used_mb}MB`);

  // ── Prometheus metrics ────────────────────────────────────────────────────
  const metricsR = await request('GET', '/api/metrics');
  snap.checks.metrics = metricsR.status === 200;
  // Parse a few values from the text
  const mtext = typeof metricsR.data === 'string' ? metricsR.data : '';
  const loadMatch  = mtext.match(/system_load_1m ([0-9.]+)/);
  const reqMatch   = mtext.match(/http_requests_total[^\n]*status="200"[^\n]* (\d+)/g) || [];
  snap.metrics.system_load_1m  = loadMatch ? parseFloat(loadMatch[1]) : 0;
  snap.metrics.http_200_total  = reqMatch.reduce((s, l) => {
    const n = l.match(/ (\d+)$/); return s + (n ? parseInt(n[1]) : 0);
  }, 0);

  // ── Core endpoint response times ──────────────────────────────────────────
  if (token) {
    const endpoints = [
      [`/api/customers?branch_id=${BRANCH_ID}`, 'customers', 'list'],
      [`/api/shipments?branch_id=${BRANCH_ID}`, 'shipments', 'list'],
      [`/api/invoices?branch_id=${BRANCH_ID}`,  'invoices',  'list'],
      [`/api/vehicles`,                          'vehicles',  'list'],
      [`/api/drivers`,                           'drivers',   'list'],
      [`/api/dashboard?branch_id=${BRANCH_ID}`,  'dashboard', 'dashboard'],
    ];
    for (const [urlPath, key, tier] of endpoints) {
      const r = await request('GET', urlPath, { token });
      snap.metrics[`${key}_ms`] = r.ms;
      snap.sla[key]  = r.ms <= SLA[tier];
      snap.checks[key] = r.status === 200;
      if (!snap.sla[key]) snap.alerts.push(`SLA_BREACH — ${key} ${r.ms}ms > ${SLA[tier]}ms`);
      // Extract counts
      const d = r.data;
      if (Array.isArray(d))          snap.counts[key] = d.length;
      else if (d?.data?.[key])       snap.counts[key] = Array.isArray(d.data[key]) ? d.data[key].length : (d.data.total ?? 0);
      else if (d?.data?.total != null) snap.counts[key] = d.data.total;
      else                            snap.counts[key] = 0;
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const allChecks = Object.values(snap.checks).filter(v => typeof v === 'boolean');
  const allSla    = Object.values(snap.sla).filter(v => typeof v === 'boolean');
  snap.summary = {
    checks_pass: allChecks.filter(Boolean).length,
    checks_total: allChecks.length,
    sla_pass: allSla.filter(Boolean).length,
    sla_total: allSla.length,
    alert_count: snap.alerts.length,
    status: snap.alerts.length === 0 ? 'GREEN' : snap.alerts.some(a => a.startsWith('AUTH') || a.startsWith('DB')) ? 'RED' : 'YELLOW',
  };

  // ── Output ────────────────────────────────────────────────────────────────
  const icon = snap.summary.status === 'GREEN' ? '🟢' : snap.summary.status === 'YELLOW' ? '🟡' : '🔴';
  console.log(`\n${icon}  ${ts}`);
  console.log(`   Status    : ${snap.summary.status}`);
  console.log(`   Uptime    : ${Math.round(snap.metrics.uptime_s / 3600)}h ${Math.round((snap.metrics.uptime_s % 3600) / 60)}m`);
  console.log(`   Heap      : ${snap.metrics.heap_used_mb} MB / ${snap.metrics.heap_total_mb} MB`);
  console.log(`   Load 1m   : ${snap.metrics.system_load_1m}`);
  console.log(`   Checks    : ${snap.summary.checks_pass}/${snap.summary.checks_total}`);
  console.log(`   SLA       : ${snap.summary.sla_pass}/${snap.summary.sla_total}`);
  console.log(`   HTTP 200s : ${snap.metrics.http_200_total} total requests served`);
  if (snap.counts.shipments != null) {
    console.log(`   Data      : ${snap.counts.shipments} shipments | ${snap.counts.customers ?? '?'} customers | ${snap.counts.vehicles ?? '?'} vehicles`);
  }
  if (snap.alerts.length) {
    console.log(`   Alerts    :`);
    snap.alerts.forEach(a => console.log(`     ⚠️  ${a}`));
  }

  // Append to ops log
  fs.appendFileSync(LOG_FILE, JSON.stringify(snap) + '\n', 'utf8');
  console.log(`\n   Log appended: ${LOG_FILE}\n`);

  return snap;
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(2); });
