require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const connectDB = require('./db/connect');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:5000'];

app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (curl, Postman, same-origin SPA)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── API routes (all scoped to /api so they never clash with React Router) ─────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/branches',      require('./routes/branches'));
app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/shipments',     require('./routes/shipments'));
app.use('/api/pod',           require('./routes/pod'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/route-expenses',require('./routes/routeExpenseRoutes'));

// ── 404 guard for unmatched /api/* — must come BEFORE SPA catch-all ───────────
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ── Serve built React frontend (production) ───────────────────────────────────
const DIST = path.join(__dirname, '../../frontend/dist');
app.use(express.static(DIST));

// SPA catch-all — serves index.html for every non-API path
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  if (status >= 500) console.error('[ERROR]', err);
  res.status(status).json({ error: message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ LocalWheels API running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err.message);
  process.exit(1);
});
