require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const fs        = require('fs');
const connectDB = require('./db/connect');

// ── Startup environment validation ────────────────────────────────────────────
// Fail fast with a clear message rather than a cryptic crash later
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
if (process.env.NODE_ENV === 'production') {
  const missing = REQUIRED_ENV.filter(k => !process.env[k] && !process.env.MONGO_URI);
  // Allow MONGO_URI as fallback for MONGODB_URI
  const reallyMissing = REQUIRED_ENV.filter(k => {
    if (k === 'MONGODB_URI') return !process.env.MONGODB_URI && !process.env.MONGO_URI;
    return !process.env[k];
  });
  if (reallyMissing.length > 0) {
    console.error('❌ Missing required environment variables:', reallyMissing.join(', '));
    console.error('   Set these in your Render dashboard under Environment Variables.');
    process.exit(1);
  }
}

// ── Ensure uploads directory exists (gitignored — must create on fresh deploy) ─
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('📁 Created uploads directory:', UPLOADS_DIR);
}

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// Production: set ALLOWED_ORIGINS=https://your-app.vercel.app on Render
// Multiple origins: comma-separated, e.g. https://a.vercel.app,https://b.vercel.app
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
    // Allow requests with no Origin header (curl, Postman, mobile, same-origin)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // In development allow all — in production block unknown origins
    if (process.env.NODE_ENV !== 'production') return cb(null, true);
    cb(new Error(`CORS: origin "${origin}" not in ALLOWED_ORIGINS`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static file uploads ───────────────────────────────────────────────────────
app.use('/uploads', express.static(UPLOADS_DIR));

// ── Health check (no auth — Render pings this to confirm service is alive) ────
app.get('/api/health', (_req, res) =>
  res.json({
    status:  'ok',
    time:    new Date().toISOString(),
    env:     process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  })
);

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/branches',       require('./routes/branches'));
app.use('/api/dashboard',      require('./routes/dashboard'));
app.use('/api/shipments',      require('./routes/shipments'));
app.use('/api/pod',            require('./routes/pod'));
app.use('/api/payments',       require('./routes/payments'));
app.use('/api/users',          require('./routes/users'));
app.use('/api/route-expenses', require('./routes/routeExpenseRoutes'));

// ── Non-API catch-all ─────────────────────────────────────────────────────────
// Dev: redirect browser requests to the Vite dev server
// Production on Render: frontend lives on Vercel — return informative 404 JSON
app.use((req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    return res.redirect(`http://localhost:8080${req.path}`);
  }
  res.status(404).json({
    error:   'Route not found',
    message: 'This is an API-only server. The frontend is hosted on Vercel.',
    hint:    `Did you mean /api${req.path}?`,
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  // Mongoose CastError → 400 instead of 500
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }
  // Mongoose ValidationError → 400
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: messages.join('; ') });
  }
  // Mongoose duplicate key → 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ error: `Duplicate value for ${field}` });
  }
  // JWT errors → 401
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  // CORS error → 403
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message });
  }

  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  if (status >= 500) console.error('[ERROR]', req.method, req.path, err);
  res.status(status).json({ error: message });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅ LocalWheels API  →  http://0.0.0.0:${PORT}`);
      console.log(`   Health check     →  http://0.0.0.0:${PORT}/api/health`);
      console.log(`   Environment      :  ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Allowed origins  :  ${allowedOrigins.join(', ')}\n`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
