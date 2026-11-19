const rateLimit = require('express-rate-limit');

const IS_PROD = process.env.NODE_ENV === 'production';
const IS_DEV  = process.env.NODE_ENV === 'development';

// ── Global API rate limiter ───────────────────────────────────────────────────
// 300 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs:          15 * 60 * 1000,
  max:               300,
  standardHeaders:   true,
  legacyHeaders:     false,
  message:           { error: 'Too many requests. Please try again later.' },
  skip:              (req) => (IS_DEV && process.env.TEST_RATE_LIMIT !== 'true'),
});

// ── Login & Authentication rate limiter ───────────────────────────────────────
// 10 attempts per 15 minutes per IP — strictly enforced in production & test suites
const loginLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             process.env.RATE_LIMIT_LOGIN_MAX ? parseInt(process.env.RATE_LIMIT_LOGIN_MAX, 10) : 10,
  standardHeaders: true,   // RateLimit-* response headers
  legacyHeaders:   false,
  message:         { error: 'Too many login attempts. Try again in 15 minute(s).' },
  skip:            (req) => (IS_DEV && process.env.TEST_RATE_LIMIT !== 'true'),
});

// ── Chat rate limiter ─────────────────────────────────────────────────────────
// 30 requests per 15 minutes per IP to protect public AI chat
const chatLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             30,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many chat requests. Please wait before sending more messages.' },
});

module.exports = {
  apiLimiter,
  loginLimiter,
  chatLimiter,
};
