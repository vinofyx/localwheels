/**
 * LocalWheels — Production Smoke Test
 *
 * Verifies a live deployment is healthy after deploy or hotfix.
 * Run from anywhere — no local dependencies required.
 *
 * Usage:
 *   node smoke-test.js <backend-url> [username] [password] [--dev]
 *
 *   --dev   Skip production-only checks (NODE_ENV, CORS restriction, metrics gate)
 *           Use this when running against a local development instance.
 *
 * Exit code 0 = all clear. Exit code 1 = one or more checks failed.
 */

const https = require('https');
const http  = require('http');
const url   = require('url');

const args    = process.argv.slice(2);
const DEV_MODE = args.includes('--dev');
const posArgs  = args.filter(a => a !== '--dev');
const [BASE_URL, USERNAME, PASSWORD] = posArgs;

if (!BASE_URL) {
  console.error('Usage: node smoke-test.js <backend-url> [username] [password] [--dev]');
  console.error('  e.g. node smoke-test.js https://localwheels.vinofyx.com rajdhani_admin MyPass123');
  console.error('  dev: node smoke-test.js http://localhost:5000 rajdhani_admin "RCS@Admin#2026" --dev');
  process.exit(1);
}

const BASE = BASE_URL.replace(/\/$/, '') + '/api';

// ── HTTP helper ───────────────────────────────────────────────────────────────
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
      timeout: 15000,
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

// ── Test runner ───────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
const failures = [];

async function check(name, fn) {
  try {
    const result = await fn();
    const ok = result?.pass !== false && result !== false;
    if (ok) {
      passed++;
      console.log(`  ✅  ${name}${result?.note ? ' — ' + result.note : ''}`);
    } else {
      failed++;
      failures.push(name + (result?.note ? ': ' + result.note : ''));
      console.log(`  ❌  ${name}${result?.note ? ' — ' + result.note : ''}`);
    }
  } catch (e) {
    failed++;
    failures.push(`${name}: ${e.message}`);
    console.log(`  ❌  ${name} — ${e.message}`);
  }
}

// ── Checks ────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║   LocalWheels Production Smoke Test              ║`);
  console.log(`║   Target: ${BASE_URL.padEnd(38)}║`);
  console.log(`║   ${new Date().toISOString().padEnd(47)}║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);

  // 1. Health
  console.log('── Health & Infrastructure ─────────────────────────');
  await check('GET /health → 200 + db connected', async () => {
    const r = await request('GET', '/health');
    const ok = r.status === 200 && r.body?.db?.ready === true;
    return { pass: ok, note: `db=${r.body?.db?.state}, env=${r.body?.env}, v=${r.body?.version}, ${r.ms}ms` };
  });

  if (!DEV_MODE) await check('GET /health → NODE_ENV is production', async () => {
    const r = await request('GET', '/health');
    return { pass: r.body?.env === 'production', note: `env=${r.body?.env}` };
  });

  await check('Security headers present (X-Content-Type-Options)', async () => {
    const r = await request('GET', '/health');
    return { pass: r.headers['x-content-type-options'] === 'nosniff' };
  });

  await check('X-Powered-By is absent (Express fingerprint hidden)', async () => {
    const r = await request('GET', '/health');
    return { pass: !r.headers['x-powered-by'] };
  });

  // 2. Auth
  console.log('\n── Authentication ───────────────────────────────────');
  let token = null;

  if (USERNAME && PASSWORD) {
    await check('POST /auth/login → 200 + JWT', async () => {
      const r = await request('POST', '/auth/login', { body: { username: USERNAME, password: PASSWORD } });
      if (r.status === 200 && r.body?.token) {
        token = r.body.token;
        return { note: `${r.ms}ms, role=${r.body?.user?.role}` };
      }
      return { pass: false, note: `status=${r.status}, body=${JSON.stringify(r.body)}` };
    });

    await check('GET /auth/me → 200 with valid token', async () => {
      if (!token) return { pass: false, note: 'no token from login' };
      const r = await request('GET', '/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      return { pass: r.status === 200, note: `${r.ms}ms, user=${r.body?.username}` };
    });
  } else {
    console.log('  ⏭  Login tests skipped — no USERNAME/PASSWORD provided');
  }

  await check('POST /auth/login without body → 400', async () => {
    const r = await request('POST', '/auth/login', { body: {} });
    return { pass: r.status === 400 };
  });

  await check('GET /auth/me without token → 401', async () => {
    const r = await request('GET', '/auth/me');
    return { pass: r.status === 401 };
  });

  await check('JWT tamper → 401 (security)', async () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6ImZha2UiLCJyb2xlIjoic3VwZXJhZG1pbiJ9.badsig';
    const r = await request('GET', '/auth/me', { headers: { Authorization: `Bearer ${fakeToken}` } });
    return { pass: r.status === 401 };
  });

  // 3. Clerk exchange
  await check('POST /auth/clerk-exchange without token → 401', async () => {
    const r = await request('POST', '/auth/clerk-exchange');
    return { pass: r.status === 401 };
  });

  // 4. Protected routes
  console.log('\n── Protected Routes ─────────────────────────────────');
  const protectedRoutes = [
    ['/branches/user', 'GET'],
    ['/companies/setup-status', 'GET'],
    ['/users', 'GET'],
    ['/shipments', 'GET'],
  ];
  for (const [path, method] of protectedRoutes) {
    await check(`${method} ${path} → 401 without token`, async () => {
      const r = await request(method, path);
      return { pass: r.status === 401 };
    });
  }

  if (token) {
    await check('GET /branches/user → 200 with token', async () => {
      const r = await request('GET', '/branches/user', { headers: { Authorization: `Bearer ${token}` } });
      return { pass: r.status === 200, note: `${r.ms}ms, count=${Array.isArray(r.body) ? r.body.length : '?'}` };
    });

    await check('GET /companies/setup-status → 200 with token', async () => {
      const r = await request('GET', '/companies/setup-status', { headers: { Authorization: `Bearer ${token}` } });
      return { pass: r.status === 200, note: `setup_completed=${r.body?.setup_completed}` };
    });
  }

  // 5. Public routes
  console.log('\n── Public Routes ────────────────────────────────────');
  await check('GET /track → no auth required', async () => {
    const r = await request('GET', '/track?lr_no=SMOKE-TEST');
    return { pass: r.status === 200 || r.status === 404, note: `status=${r.status}` };
  });

  await check('POST /chat → accessible without token', async () => {
    const r = await request('POST', '/chat', {
      body: { messages: [{ role: 'user', content: 'ping' }], session_id: 'smoke-test' },
    });
    return { pass: r.status === 200 || r.status === 429 || r.status === 503, note: `status=${r.status}` };
  });

  // 6. CORS
  console.log('\n── CORS & Rate Limiting ─────────────────────────────');
  if (!DEV_MODE) await check('CORS blocks unknown origin in production', async () => {
    const r = await new Promise((resolve, reject) => {
      const parsed = new url.URL(BASE + '/health');
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.request({
        hostname: parsed.hostname, port: parsed.port || 443,
        path: '/api/health', method: 'OPTIONS',
        headers: { 'Origin': 'https://evil-attacker.example.com', 'Access-Control-Request-Method': 'GET' },
        timeout: 10000,
      }, res => { resolve({ headers: res.headers }); res.resume(); });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      req.end();
    });
    const origin = r.headers['access-control-allow-origin'];
    // In production, evil origin should NOT be reflected
    const blocked = !origin || origin !== 'https://evil-attacker.example.com';
    return { pass: blocked, note: `allow-origin: ${origin || '(absent)'}` };
  });

  if (!DEV_MODE) await check('GET /metrics → 401 without METRICS_TOKEN', async () => {
    const r = await request('GET', '/metrics');
    return { pass: r.status === 401 || r.status === 403, note: `status=${r.status} (metrics gated)` };
  });

  // ── Summary ─────────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  RESULT: ${String(passed + '/' + total + ' passed').padEnd(10)} ${failed === 0 ? '🟢 ALL CLEAR' : '🔴 FAILURES FOUND'}          ║`);
  console.log(`╚══════════════════════════════════════════════════╝`);

  if (failures.length) {
    console.log('\n  Failures:');
    failures.forEach(f => console.log('  ❌ ' + f));
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

run();
