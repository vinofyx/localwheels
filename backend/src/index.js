require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const connectDB = require('./db/connect');

// ── Ensure uploads directory exists (it is gitignored; must create on fresh deploy) ──
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('📁 Created uploads directory:', UPLOADS_DIR);
}

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// In production set ALLOWED_ORIGINS=https://your-app.vercel.app on Render
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:5000',
    ];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static file uploads ───────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString(), env: process.env.NODE_ENV || 'development' })
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

// ── Non-API routes ────────────────────────────────────────────────────────────
// In dev: redirect browser to Vite frontend (localhost:8080)
// In production on Render: the frontend lives on Vercel, so just say so
app.get('*', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    // Redirect any non-API browser request to the Vite dev server
    return res.redirect(`http://localhost:8080${req.path}`);
  }
  res.status(404).json({ error: 'Route not found. Frontend is hosted on Vercel.' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  if (status >= 500) console.error('[ERROR]', err);
  res.status(status).json({ error: message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ LocalWheels API running on port ${PORT}`);
    console.log(`   Allowed origins : ${allowedOrigins.join(', ')}`);
    console.log(`   Environment     : ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(err => {
  console.error('❌ Failed to connect to MongoDB:', err.message);
  process.exit(1);
});
