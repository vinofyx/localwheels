/**
 * LocalWheels Production Frontend & Routing Integration Test Suite
 * Validates that backend/src/index.js serves:
 * 1. React SPA from backend/public on GET /
 * 2. Static compiled assets from /assets/
 * 3. SPA fallback on deep routes (e.g. /login, /dashboard)
 * 4. API endpoints without interception (/api/health, /api/auth/login)
 * 5. Strict API 404 JSON behavior for unknown /api/* endpoints
 */

const path = require('path');
const fs = require('fs');
const http = require('http');

// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(__dirname, '.env') });

process.env.NODE_ENV = 'production';
process.env.PORT = '5199'; // Ephemeral port for test
process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || 'http://localhost:5199,https://localwheels.vinofyx.com';
process.env.JWT_SECRET = process.env.JWT_SECRET || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

console.log('================================================================');
console.log('FRONTEND SERVING & API ROUTING VERIFICATION SUITE');
console.log('================================================================');

// Ensure backend/public exists before starting
const publicDir = path.resolve(__dirname, 'public');
if (!fs.existsSync(path.join(publicDir, 'index.html'))) {
  console.error('❌ backend/public/index.html not found! Run npm run build first.');
  process.exit(1);
}

// Find first asset in backend/public/assets
const assetsDir = path.join(publicDir, 'assets');
const assetFiles = fs.readdirSync(assetsDir);
const sampleJsAsset = assetFiles.find(f => f.endsWith('.js'));
const sampleCssAsset = assetFiles.find(f => f.endsWith('.css'));

let passed = 0;
let failed = 0;

function assert(condition, testName, details) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName} ${details ? '- ' + details : ''}`);
    failed++;
  }
}

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function waitForServer(host, port, maxTries = 30) {
  for (let i = 0; i < maxTries; i++) {
    try {
      const res = await request({ host, port, path: '/api/health', method: 'GET', timeout: 500 });
      if (res.statusCode === 200) return true;
    } catch {
      // wait and retry
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function runTests() {
  const host = '127.0.0.1';
  const port = 5199;

  console.log('Waiting for Express server to connect to database and listen on port 5199...');
  const ready = await waitForServer(host, port);
  if (!ready) {
    console.error('❌ Server did not become ready within 15 seconds.');
    process.exit(1);
  }
  console.log('Server is online and responding! Running test suite...\n');

  try {
    // 1. Homepage: GET /
    console.log('--- 1. ROOT & STATIC SPA ROUTING ---');
    const resRoot = await request({ host, port, path: '/', method: 'GET' });
    assert(resRoot.statusCode === 200, 'GET / returns 200 OK', `got ${resRoot.statusCode}`);
    assert((resRoot.headers['content-type'] || '').includes('text/html'), 'GET / returns Content-Type text/html');
    assert(resRoot.body.includes('id="root"'), 'GET / body contains React mount point (<div id="root">)');
    assert(resRoot.body.includes('/assets/'), 'GET / body includes compiled script references');
    assert(resRoot.headers['cache-control']?.includes('no-cache'), 'index.html has no-cache header');

    // 2. JavaScript Asset
    if (sampleJsAsset) {
      const resJs = await request({ host, port, path: `/assets/${sampleJsAsset}`, method: 'GET' });
      assert(resJs.statusCode === 200, `GET /assets/${sampleJsAsset} returns 200 OK`);
      assert((resJs.headers['content-type'] || '').includes('javascript'), 'JavaScript asset returns javascript MIME type');
    }

    // 3. CSS Asset
    if (sampleCssAsset) {
      const resCss = await request({ host, port, path: `/assets/${sampleCssAsset}`, method: 'GET' });
      assert(resCss.statusCode === 200, `GET /assets/${sampleCssAsset} returns 200 OK`);
      assert((resCss.headers['content-type'] || '').includes('css'), 'CSS asset returns text/css MIME type');
    }

    // 4. Client-side SPA routes (Must return index.html, NOT 404)
    console.log('\n--- 2. CLIENT-SIDE SPA DEEP ROUTES ---');
    const resLogin = await request({ host, port, path: '/login', method: 'GET' });
    assert(resLogin.statusCode === 200, 'GET /login returns 200 OK via SPA fallback');
    assert(resLogin.body.includes('id="root"'), 'GET /login serves index.html for React Router');

    const resDash = await request({ host, port, path: '/dashboard', method: 'GET' });
    assert(resDash.statusCode === 200, 'GET /dashboard returns 200 OK via SPA fallback');

    const resDeep = await request({ host, port, path: '/shipments/touching-lr', method: 'GET' });
    assert(resDeep.statusCode === 200, 'GET /shipments/touching-lr returns 200 OK via SPA fallback');

    // 5. API Routes: Must NOT be intercepted by SPA fallback
    console.log('\n--- 3. API ROUTES & NON-INTERCEPTION ---');
    const resHealth = await request({ host, port, path: '/api/health', method: 'GET' });
    assert(resHealth.statusCode === 200, 'GET /api/health returns 200 OK');
    assert((resHealth.headers['content-type'] || '').includes('json'), 'GET /api/health returns JSON');
    const healthJson = JSON.parse(resHealth.body);
    assert(healthJson.status === 'ok', 'GET /api/health payload status is "ok"');
    assert(healthJson.env === 'production', 'GET /api/health confirms env is production');

    // 6. Auth API Route: POST /api/auth/login with missing credentials
    const resAuth = await request({
      host,
      port,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ email: 'test@invalid.com' }));
    assert(resAuth.statusCode === 400 || resAuth.statusCode === 401, 'POST /api/auth/login is handled by auth router (got ' + resAuth.statusCode + ')');
    assert((resAuth.headers['content-type'] || '').includes('json'), 'POST /api/auth/login returns JSON error (NOT HTML SPA)');

    // 7. Unknown API Route: GET /api/nonexistent-endpoint
    console.log('\n--- 4. STRICT API 404 BEHAVIOR ---');
    const resUnknownApi = await request({ host, port, path: '/api/unknown-service-probe', method: 'GET' });
    assert(resUnknownApi.statusCode === 404, 'GET /api/unknown-service-probe returns 404 Not Found', `got ${resUnknownApi.statusCode}`);
    assert((resUnknownApi.headers['content-type'] || '').includes('json'), 'Unknown API endpoint returns JSON (NOT HTML)');
    const unknownJson = JSON.parse(resUnknownApi.body);
    assert(unknownJson.error === 'Route not found', 'Unknown API endpoint returns error: "Route not found"');
    assert(unknownJson.message === 'All API endpoints are under /api/.', 'Returns informative API routing message');

    // 8. Suppressed Dev Index: GET /api
    const resApiRoot = await request({ host, port, path: '/api', method: 'GET' });
    assert(resApiRoot.statusCode === 404, 'GET /api returns 404 Not Found in production');
    const apiRootJson = JSON.parse(resApiRoot.body);
    assert(apiRootJson.error === 'Not found', 'GET /api returns {"error":"Not found"}');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    console.log('\n================================================================');
    console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('================================================================');
    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('✅ ALL FRONTEND SERVING & API ROUTING TESTS PASSED');
      process.exit(0);
    }
  }
}

// Start backend app
try {
  require('./src/index.js');
  runTests();
} catch (e) {
  console.error('Failed to load backend/src/index.js:', e);
  process.exit(1);
}
