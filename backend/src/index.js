require('dotenv').config();
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const compression  = require('compression');
const path         = require('path');
const fs           = require('fs');
const connectDB    = require('./db/connect');

const IS_PROD = process.env.NODE_ENV === 'production';
const IS_DEV  = !IS_PROD;

// ── Startup environment validation ────────────────────────────────────────────
// Fail fast with a clear message rather than a cryptic crash later
if (IS_PROD) {
  const missing = [];
  if (!process.env.MONGODB_URI && !process.env.MONGO_URI) missing.push('MONGODB_URI');
  if (!process.env.JWT_SECRET)                             missing.push('JWT_SECRET');
  if (!process.env.ALLOWED_ORIGINS)                        missing.push('ALLOWED_ORIGINS');
  if (missing.length) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('   Set these in your Render dashboard under Environment Variables.');
    process.exit(1);
  }
  // Warn if JWT_SECRET looks weak (less than 32 hex chars = 128 bits)
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET appears short — use at least 64 random hex chars in production.');
    console.warn('   Generate: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  }
}

// ── Ensure uploads directory exists ──────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('📁 Created uploads directory:', UPLOADS_DIR);
}

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  // /uploads files are fetched by the frontend from a different origin
  crossOriginResourcePolicy: { policy: 'cross-origin' },

  // Content-Security-Policy
  // Production : pure JSON API — no resources of any kind, no framing allowed.
  // Development: HTML landing page served at / needs 'unsafe-inline' for its <style> block.
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc:     ["'none'"],
      styleSrc:       IS_DEV ? ["'unsafe-inline'"] : ["'none'"],
      frameAncestors: ["'none'"],
    },
  },

  // Strict-Transport-Security — only meaningful over HTTPS (Render provides TLS)
  hsts: IS_PROD ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}));

// ── Trust proxy (Render / Heroku sit behind a reverse proxy) ─────────────────
if (IS_PROD) app.set('trust proxy', 1);

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:5000',
    ];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin)                         return cb(null, true); // curl, Postman, mobile
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (IS_DEV)                          return cb(null, true); // dev: allow all
    cb(new Error(`CORS: origin "${origin}" not in ALLOWED_ORIGINS`));
  },
  credentials: true,
}));

// ── HTTP request logging ──────────────────────────────────────────────────────
// Dev: coloured dev format; Prod: combined (Apache-style) for log aggregators
app.use(morgan(IS_PROD ? 'combined' : 'dev'));

// ── Global API rate limiter ───────────────────────────────────────────────────
// 300 requests per 15 minutes per IP — protects all /api/* routes from abuse
const apiLimiter = rateLimit({
  windowMs:          15 * 60 * 1000,
  max:               300,
  standardHeaders:   true,  // X-RateLimit-* headers
  legacyHeaders:     false,
  message:           { error: 'Too many requests. Please try again later.' },
  skip:              (req) => IS_DEV, // no global limit in dev
});
app.use('/api', apiLimiter);

// ── Login-specific rate limiter ───────────────────────────────────────────────
// 10 attempts per 15 minutes per IP — stricter than the global limiter
const loginLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             10,
  standardHeaders: true,   // X-RateLimit-* response headers
  legacyHeaders:   false,
  message:         { error: 'Too many login attempts. Try again in 15 minute(s).' },
  skip:            () => IS_DEV,  // no login limit in dev — default keyGenerator handles IPv6
});

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static file uploads ───────────────────────────────────────────────────────
app.use('/uploads', express.static(UPLOADS_DIR));

// ── Root / API-index ─────────────────────────────────────────────────────────
// Dev: rich HTML landing page + JSON endpoint list
// Prod: minimal JSON (don't expose endpoint inventory to the public internet)
app.get('/', (req, res) => {
  if (IS_PROD) {
    return res.json({
      name:    'LocalWheels API',
      status:  'ok',
      health:  '/api/health',
    });
  }

  const base     = `http://localhost:${process.env.PORT || 5000}`;
  const frontend = 'http://localhost:8080';

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>LocalWheels API — Dev</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;padding:48px 24px}
    .wrap{max-width:760px;margin:auto}
    .badge{display:inline-block;padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase}
    .ok{background:#052e16;color:#4ade80;border:1px solid #166534}
    .dev{background:#1e1b4b;color:#818cf8;border:1px solid #3730a3}
    h1{font-size:28px;font-weight:700;color:#f8fafc;margin-bottom:6px}
    .sub{color:#94a3b8;font-size:14px;margin-bottom:36px}
    .card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;margin-bottom:20px}
    .card h2{font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:16px}
    .row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #0f172a}
    .row:last-child{border-bottom:none}
    .method{font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;min-width:52px;text-align:center}
    .GET{background:#052e16;color:#4ade80}.POST{background:#1c1917;color:#fb923c}
    .PUT{background:#1e1b4b;color:#818cf8}.DELETE{background:#2d0a0a;color:#f87171}.PATCH{background:#172554;color:#60a5fa}
    .path{font-family:'SF Mono','Fira Code',monospace;font-size:13px;color:#e2e8f0;flex:1}
    .desc{font-size:12px;color:#64748b}
    a.link{color:#38bdf8;text-decoration:none;font-family:monospace;font-size:13px}
    a.link:hover{text-decoration:underline}
    .meta{display:flex;gap:16px;flex-wrap:wrap}
    .mi{display:flex;flex-direction:column;gap:4px}
    .ml{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px}
    .mv{font-size:13px;color:#e2e8f0;font-family:monospace}
  </style>
</head>
<body>
<div class="wrap">
  <h1>🚚 LocalWheels API <span class="badge dev">DEV</span></h1>
  <p class="sub">Logistics Management Platform — Backend API Server</p>
  <div class="card">
    <h2>Server Status</h2>
    <div class="meta">
      <div class="mi"><span class="ml">Status</span><span><span class="badge ok">● Online</span></span></div>
      <div class="mi"><span class="ml">Environment</span><span><span class="badge dev">development</span></span></div>
      <div class="mi"><span class="ml">Version</span><span class="mv">${process.env.npm_package_version || '1.0.0'}</span></div>
      <div class="mi"><span class="ml">Time</span><span class="mv">${new Date().toISOString()}</span></div>
      <div class="mi"><span class="ml">Frontend</span><a href="${frontend}" class="link" target="_blank">${frontend}</a></div>
    </div>
  </div>
  <div class="card">
    <h2>Quick Links</h2>
    <div class="row"><span class="method GET">GET</span><a href="${base}/api/health" class="path link" target="_blank">/api/health</a><span class="desc">Health check</span></div>
    <div class="row"><span class="method GET">GET</span><a href="${base}/api" class="path link" target="_blank">/api</a><span class="desc">Endpoint index (JSON)</span></div>
  </div>
  <div class="card">
    <h2>API Endpoints</h2>
    <div class="row"><span class="method POST">POST</span><span class="path">/api/auth/login</span><span class="desc">Login — returns JWT</span></div>
    <div class="row"><span class="method GET">GET</span><span class="path">/api/auth/me</span><span class="desc">Current user info</span></div>
    <div class="row"><span class="method GET">GET</span><span class="path">/api/dashboard</span><span class="desc">Branch KPI metrics</span></div>
    <div class="row"><span class="method GET">GET</span><span class="path">/api/branches</span><span class="desc">List branches (admin)</span></div>
    <div class="row"><span class="method POST">POST</span><span class="path">/api/branches</span><span class="desc">Create branch (admin)</span></div>
    <div class="row"><span class="method PUT">PUT</span><span class="path">/api/branches/:id</span><span class="desc">Update branch (admin)</span></div>
    <div class="row"><span class="method DELETE">DELETE</span><span class="path">/api/branches/:id</span><span class="desc">Soft-delete branch — sets is_active=false (admin)</span></div>
    <div class="row"><span class="method GET">GET</span><span class="path">/api/shipments</span><span class="desc">List shipments (paginated)</span></div>
    <div class="row"><span class="method POST">POST</span><span class="path">/api/shipments</span><span class="desc">Create shipment + LR</span></div>
    <div class="row"><span class="method PATCH">PATCH</span><span class="path">/api/shipments/:id/status</span><span class="desc">Update status</span></div>
    <div class="row"><span class="method GET">GET</span><span class="path">/api/shipments/track/:lr</span><span class="desc">Public tracking (no auth)</span></div>
    <div class="row"><span class="method GET">GET</span><span class="path">/api/pod</span><span class="desc">POD list</span></div>
    <div class="row"><span class="method POST">POST</span><span class="path">/api/pod/:id/upload</span><span class="desc">Upload POD file</span></div>
    <div class="row"><span class="method PATCH">PATCH</span><span class="path">/api/pod/:id/verify</span><span class="desc">Verify POD</span></div>
    <div class="row"><span class="method GET">GET</span><span class="path">/api/payments</span><span class="desc">Payment list + summary</span></div>
    <div class="row"><span class="method PATCH">PATCH</span><span class="path">/api/payments/:id/collect</span><span class="desc">Mark payment collected</span></div>
    <div class="row"><span class="method GET">GET</span><span class="path">/api/users</span><span class="desc">User list (admin)</span></div>
    <div class="row"><span class="method POST">POST</span><span class="path">/api/users</span><span class="desc">Create user (admin)</span></div>
    <div class="row"><span class="method GET">GET</span><span class="path">/api/route-expenses</span><span class="desc">Route expense list</span></div>
    <div class="row"><span class="method POST">POST</span><span class="path">/api/route-expenses</span><span class="desc">Create route expense</span></div>
  </div>
  <p style="text-align:center;color:#334155;font-size:12px;margin-top:24px">
    All endpoints require <code style="color:#64748b">Authorization: Bearer &lt;token&gt;</code>
    except <code style="color:#64748b">/api/auth/login</code>, <code style="color:#64748b">/api/health</code>
    and <code style="color:#64748b">/api/shipments/track/:lr</code>
  </p>
</div>
</body>
</html>`);
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({
    status:  'ok',
    time:    new Date().toISOString(),
    env:     process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    uptime:  Math.round(process.uptime()),
  })
);

// ── API endpoint index (dev only) ─────────────────────────────────────────────
app.get('/api', (_req, res) => {
  if (IS_PROD) return res.status(404).json({ error: 'Not found' });
  res.json({
    name:    'LocalWheels API',
    version: process.env.npm_package_version || '1.0.0',
    env:     'development',
    status:  'ok',
    endpoints: [
      { method: 'GET',   path: '/api/health',                auth: false },
      { method: 'POST',  path: '/api/auth/login',            auth: false },
      { method: 'GET',   path: '/api/auth/me',               auth: true  },
      { method: 'GET',   path: '/api/dashboard',             auth: true  },
      { method: 'GET',   path: '/api/branches',              auth: true  },
      { method: 'GET',   path: '/api/branches/user',         auth: true  },
      { method: 'POST',  path: '/api/branches',              auth: true  },
      { method: 'PUT',   path: '/api/branches/:id',          auth: true  },
      { method: 'DELETE',path: '/api/branches/:id',          auth: true, note: 'soft-delete — sets is_active=false' },
      { method: 'GET',   path: '/api/shipments',             auth: true  },
      { method: 'POST',  path: '/api/shipments',             auth: true  },
      { method: 'GET',   path: '/api/shipments/:id',         auth: true  },
      { method: 'PUT',   path: '/api/shipments/:id',         auth: true  },
      { method: 'PATCH', path: '/api/shipments/:id/status',  auth: true  },
      { method: 'GET',   path: '/api/shipments/track/:lr',   auth: false },
      { method: 'GET',   path: '/api/pod',                   auth: true  },
      { method: 'POST',  path: '/api/pod/:id/upload',        auth: true  },
      { method: 'PATCH', path: '/api/pod/:id/verify',        auth: true  },
      { method: 'GET',   path: '/api/payments',              auth: true  },
      { method: 'PATCH', path: '/api/payments/:id/collect',  auth: true  },
      { method: 'GET',   path: '/api/users',                 auth: true  },
      { method: 'POST',  path: '/api/users',                 auth: true  },
      { method: 'PUT',   path: '/api/users/:id',             auth: true  },
      { method: 'DELETE',path: '/api/users/:id',             auth: true  },
      { method: 'GET',   path: '/api/route-expenses',        auth: true  },
      { method: 'POST',  path: '/api/route-expenses',        auth: true  },
      { method: 'GET',   path: '/api/route-expenses/:id',    auth: true  },
      { method: 'PUT',   path: '/api/route-expenses/:id',    auth: true  },
      { method: 'DELETE',path: '/api/route-expenses/:id',    auth: true  },
    ],
  });
});

// ── API routes ────────────────────────────────────────────────────────────────
// Login route gets its own tighter limiter
const authRouter = require('./routes/auth');
app.use('/api/auth/login', loginLimiter);  // applied before the router
app.use('/api/auth',           authRouter);
app.use('/api/branches',       require('./routes/branches'));
app.use('/api/dashboard',      require('./routes/dashboard'));
app.use('/api/shipments',      require('./routes/shipments'));
app.use('/api/pod',            require('./routes/pod'));
app.use('/api/payments',       require('./routes/payments'));
app.use('/api/users',          require('./routes/users'));
app.use('/api/route-expenses', require('./routes/routeExpenseRoutes'));
app.use('/api/ai',             require('./routes/ai'));
app.use('/api/chat',           require('./routes/chat'));
app.use('/api/customers',      require('./routes/customers'));
app.use('/api/bookings',       require('./routes/bookings'));
app.use('/api/tracking',       require('./routes/tracking'));
app.use('/api/quotes',         require('./routes/quotes'));
app.use('/api/warehouses',     require('./routes/warehouses'));
app.use('/api/vehicles',       require('./routes/vehicles'));
app.use('/api/drivers',        require('./routes/drivers'));
app.use('/api/invoices',       require('./routes/invoices'));
app.use('/api/complaints',         require('./routes/complaints'));
app.use('/api/notifications',      require('./routes/notifications'));
app.use('/api/faq',                require('./routes/faq'));
app.use('/api/live-agent',         require('./routes/liveAgent'));
app.use('/api/whatsapp',           require('./routes/whatsapp'));
app.use('/api/support-analytics',  require('./routes/supportAnalytics'));

// ── Non-API catch-all 404 ─────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error:   'Route not found',
    message: 'This is an API-only server. All endpoints are under /api.',
    hint:    `Did you mean /api${req.path}?`,
    ...(IS_DEV && { frontend: 'http://localhost:8080' }),
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: messages.join('; ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ error: `Duplicate value for ${field}` });
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }
  // Multer file-type error
  if (err.message?.startsWith('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }

  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  if (status >= 500) {
    // In production don't leak internal error details
    console.error('[ERROR]', req.method, req.path, err);
    if (IS_PROD) return res.status(500).json({ error: 'Internal server error' });
  }
  res.status(status).json({ error: message });
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const mongoose = require('mongoose');
function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully…`);
  server.close(async () => {
    await mongoose.connection.close();
    console.log('✅ Server closed, MongoDB disconnected');
    process.exit(0);
  });
  // Force-exit after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;
let server;

connectDB()
  .then(() => {
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅ LocalWheels API  →  http://0.0.0.0:${PORT}`);
      console.log(`   Health check     →  http://0.0.0.0:${PORT}/api/health`);
      console.log(`   Environment      :  ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Allowed origins  :  ${allowedOrigins.join(', ')}`);
      console.log(`   Rate limits      :  login=10/15min  api=300/15min\n`);
    });

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
