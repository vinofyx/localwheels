const http = require('http');

// All backend routes are now mounted under /api/
// Vite proxy forwards /api/* → /api/* on backend (no rewrite)
// Direct port 5000 calls also use /api/ prefix

function req(opts, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: opts.port || 5000,
      path: opts.path,
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(opts.token ? { Authorization: 'Bearer ' + opts.token } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const r = http.request(options, res => {
      let buf = '';
      res.on('data', d => buf += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, body: buf.slice(0, 300) }); }
      });
    });
    r.on('error', err => resolve({ status: 0, body: err.message }));
    if (data) r.write(data);
    r.end();
  });
}

let pass = 0, fail = 0;
function assert(label, cond, detail) {
  if (cond) { console.log('  PASS:', label); pass++; }
  else { console.log('  FAIL:', label, detail !== undefined ? String(detail) : ''); fail++; }
}

async function run() {
  console.log('\n=== LOCALWHEELS E2E TEST SUITE ===\n');

  // ── 1. Health ─────────────────────────────────────────────────────────────
  console.log('--- 1. Health ---');
  const h = await req({ path: '/api/health' });
  assert('GET /api/health → 200', h.status === 200, h.status);
  assert('health.status === "ok"', h.body && h.body.status === 'ok', JSON.stringify(h.body));

  // Backend is API-only (frontend is on Vercel) — non-API routes return 404 JSON in prod
  const root = await req({ path: '/' });
  assert('GET / → responds (API-only backend)', root.status === 200 || root.status === 302 || root.status === 404, root.status);
  const dashPage = await req({ path: '/dashboard' });
  assert('GET /dashboard → redirect or 404 (not 500)', dashPage.status !== 500, dashPage.status);
  const loginPage = await req({ path: '/login' });
  assert('GET /login → redirect or 404 (not 500)', loginPage.status !== 500, loginPage.status);

  // ── 2. Auth ──────────────────────────────────────────────────────────────
  console.log('--- 2. Auth ---');
  const badLogin = await req({ path: '/api/auth/login', method: 'POST' }, { username: 'xxx', password: 'xxx' });
  assert('bad creds → 400/401', badLogin.status === 400 || badLogin.status === 401, badLogin.status);

  const login = await req({ path: '/api/auth/login', method: 'POST' }, { username: 'admin', password: 'admin123' });
  assert('POST /api/auth/login → 200', login.status === 200, login.status + ' ' + JSON.stringify(login.body).slice(0, 120));
  const token = login.body && login.body.token;
  assert('login.token present', !!token);
  assert('login.user present', !!(login.body && login.body.user));

  const me = await req({ path: '/api/auth/me', token });
  assert('GET /api/auth/me → 200', me.status === 200, me.status);
  assert('me.username present', !!(me.body && me.body.username));

  // ── 3. Branches ───────────────────────────────────────────────────────────
  console.log('--- 3. Branches ---');
  const userBranches = await req({ path: '/api/branches/user', token });
  assert('GET /api/branches/user → 200', userBranches.status === 200, userBranches.status);
  assert('/branches/user is array', Array.isArray(userBranches.body), typeof userBranches.body);
  const branchId = userBranches.body[0] && (userBranches.body[0]._id || userBranches.body[0].id);
  assert('at least 1 branch exists', !!branchId, 'branchId=' + branchId);

  const allBranches = await req({ path: '/api/branches', token });
  assert('GET /api/branches → 200', allBranches.status === 200, allBranches.status);
  assert('/branches is array', Array.isArray(allBranches.body));

  // ── 4. Dashboard ──────────────────────────────────────────────────────────
  console.log('--- 4. Dashboard ---');
  const dash = await req({ path: '/api/dashboard?branch_id=' + branchId, token });
  assert('GET /api/dashboard → 200', dash.status === 200, dash.status + ' ' + JSON.stringify(dash.body).slice(0, 120));
  assert('dashboard.eway_expiry exists', dash.body && dash.body.eway_expiry !== undefined);
  assert('dashboard.hold_cn exists', dash.body && dash.body.hold_cn !== undefined);
  assert('dashboard.paid_outstanding exists', dash.body && dash.body.paid_outstanding !== undefined);
  assert('dashboard.to_pay exists', dash.body && dash.body.to_pay !== undefined);
  assert('dashboard.pod_submit exists', dash.body && dash.body.pod_submit !== undefined);

  // ── 5. Shipments CRUD ────────────────────────────────────────────────────
  console.log('--- 5. Shipments CRUD ---');
  const createShip = await req({ path: '/api/shipments', method: 'POST', token }, {
    branch_id: branchId,
    sender_name: 'E2E Sender',
    sender_phone: '9999999999',
    receiver_name: 'E2E Receiver',
    receiver_phone: '8888888888',
    origin: 'Mumbai',
    destination: 'Delhi',
    weight: 10,
    freight_amount: 500,
    payment_type: 'paid',
  });
  assert('POST /api/shipments → 201', createShip.status === 201, createShip.status + ' ' + JSON.stringify(createShip.body).slice(0, 120));
  const shipId = createShip.body && (createShip.body.id || createShip.body._id);
  const lrNumber = createShip.body && createShip.body.lr_number;
  assert('shipment.id present', !!shipId, JSON.stringify(createShip.body));
  assert('shipment.lr_number present', !!lrNumber);

  const getShip = await req({ path: '/api/shipments/' + shipId, token });
  assert('GET /api/shipments/:id → 200', getShip.status === 200, getShip.status + ' ' + JSON.stringify(getShip.body).slice(0, 120));
  assert('shipment.sender_name matches', getShip.body && getShip.body.sender_name === 'E2E Sender');

  const listShip = await req({ path: '/api/shipments?branch_id=' + branchId + '&limit=5', token });
  assert('GET /api/shipments list → 200', listShip.status === 200, listShip.status);
  assert('/shipments list has data[]', listShip.body && Array.isArray(listShip.body.data));
  assert('/shipments list has pagination', listShip.body && listShip.body.pagination !== undefined);

  const track = await req({ path: '/api/shipments/track/' + lrNumber });
  assert('GET /api/shipments/track/:lr → 200', track.status === 200, track.status);
  assert('tracking.lr_number present', track.body && !!track.body.lr_number);

  const statusUp = await req({ path: '/api/shipments/' + shipId + '/status', method: 'PATCH', token }, { status: 'in_transit', location: 'Nagpur' });
  assert('PATCH → in_transit → 200', statusUp.status === 200, statusUp.status + ' ' + JSON.stringify(statusUp.body).slice(0, 100));

  const statusDel = await req({ path: '/api/shipments/' + shipId + '/status', method: 'PATCH', token }, { status: 'delivered', location: 'Delhi' });
  assert('PATCH → delivered → 200', statusDel.status === 200, statusDel.status);

  // ── 6. POD ────────────────────────────────────────────────────────────────
  console.log('--- 6. POD ---');
  const pods = await req({ path: '/api/pod?branch_id=' + branchId, token });
  assert('GET /api/pod → 200', pods.status === 200, pods.status);
  assert('/pod has data[]', pods.body && Array.isArray(pods.body.data));
  assert('/pod has pagination', pods.body && pods.body.pagination !== undefined);

  // ── 7. Payments ───────────────────────────────────────────────────────────
  console.log('--- 7. Payments ---');
  const pays = await req({ path: '/api/payments?branch_id=' + branchId, token });
  assert('GET /api/payments → 200', pays.status === 200, pays.status);
  assert('/payments has data[]', pays.body && Array.isArray(pays.body.data));
  assert('/payments has summary', pays.body && pays.body.summary !== undefined);
  assert('/payments has pagination', pays.body && pays.body.pagination !== undefined);

  // ── 8. Users ──────────────────────────────────────────────────────────────
  console.log('--- 8. Users ---');
  const users = await req({ path: '/api/users', token });
  assert('GET /api/users → 200', users.status === 200, users.status);
  assert('/users returns array', Array.isArray(users.body));

  const ts = Date.now();
  const newUser = await req({ path: '/api/users', method: 'POST', token }, {
    username: 'e2euser_' + ts,
    password: 'Test1234',
    full_name: 'E2E User',
    role: 'staff',
    branch_ids: [branchId],
  });
  assert('POST /api/users → 201', newUser.status === 201, newUser.status + ' ' + JSON.stringify(newUser.body).slice(0, 120));
  assert('new user._id present', !!(newUser.body && (newUser.body._id || newUser.body.id)));

  // ── 9. Route Expenses CRUD ───────────────────────────────────────────────
  console.log('--- 9. Route Expenses CRUD ---');
  const createRE = await req({ path: '/api/route-expenses', method: 'POST', token }, {
    routeName: 'E2E-Route-' + ts,
    loadType: 'FTL',
    transitPeriodDays: 3,
    routeDiesel: 5000,
    routeAdvance: 2000,
    tollAmount: 800,
    expenses: [{ routeCharge: 'Labour', amount: 500 }],
  });
  assert('POST /api/route-expenses → 201', createRE.status === 201, createRE.status + ' ' + JSON.stringify(createRE.body).slice(0, 120));
  const reId = createRE.body && createRE.body.data && (createRE.body.data._id || createRE.body.data.id);
  assert('route expense data._id present', !!reId, JSON.stringify(createRE.body).slice(0, 120));

  const listRE = await req({ path: '/api/route-expenses', token });
  assert('GET /api/route-expenses → 200', listRE.status === 200, listRE.status);
  assert('/route-expenses has data[]', listRE.body && Array.isArray(listRE.body.data));

  const getREById = await req({ path: '/api/route-expenses/' + reId, token });
  assert('GET /api/route-expenses/:id → 200', getREById.status === 200, getREById.status);
  assert('route expense routeName matches', getREById.body && getREById.body.data && getREById.body.data.routeName && getREById.body.data.routeName.startsWith('E2E-Route-'));

  const updRE = await req({ path: '/api/route-expenses/' + reId, method: 'PUT', token }, {
    routeName: 'E2E-Route-Updated-' + ts,
    loadType: 'LTL',
    transitPeriodDays: 4,
    routeDiesel: 6000,
    routeAdvance: 2500,
    tollAmount: 900,
    expenses: [{ routeCharge: 'Labour', amount: 600 }],
  });
  assert('PUT /api/route-expenses/:id → 200', updRE.status === 200, updRE.status + ' ' + JSON.stringify(updRE.body).slice(0, 80));
  assert('PUT success:true', updRE.body && updRE.body.success === true);

  const delRE = await req({ path: '/api/route-expenses/' + reId, method: 'DELETE', token });
  assert('DELETE /api/route-expenses/:id → 200', delRE.status === 200, delRE.status);
  assert('DELETE success:true', delRE.body && delRE.body.success === true);

  const afterDel = await req({ path: '/api/route-expenses/' + reId, token });
  assert('GET deleted route-expense → 404', afterDel.status === 404, afterDel.status);

  // ── 10. Vite Proxy ────────────────────────────────────────────────────────
  // Vite proxy: /api/* → http://localhost:5000/api/* (no rewrite, routes under /api/)
  const VITE_PORT = parseInt(process.env.VITE_PORT || '8081', 10);
  console.log(`--- 10. Vite Proxy (port ${VITE_PORT}) ---`);
  const proxyHealth = await req({ port: VITE_PORT, path: '/api/health' });
  if (proxyHealth.status === 0) {
    console.log(`  SKIP: Vite dev server not running on port ${VITE_PORT}`);
  } else {
    assert('Vite /api/health proxy → 200', proxyHealth.status === 200, proxyHealth.status);
    assert('proxy health.status === "ok"', proxyHealth.body && proxyHealth.body.status === 'ok');

    const proxyLogin = await req({ port: VITE_PORT, path: '/api/auth/login', method: 'POST' }, { username: 'admin', password: 'admin123' });
    assert('Vite /api/auth/login proxy → 200', proxyLogin.status === 200, proxyLogin.status);
    assert('proxy login.token present', !!(proxyLogin.body && proxyLogin.body.token));

    const proxyBranches = await req({ port: VITE_PORT, path: '/api/branches/user', token });
    assert('Vite /api/branches/user proxy → 200', proxyBranches.status === 200, proxyBranches.status);
    assert('proxy branches is array', Array.isArray(proxyBranches.body));
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n================================');
  console.log('PASSED:', pass, ' FAILED:', fail);
  console.log('================================\n');
  if (fail > 0) process.exit(1);
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
