const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for /api/auth/login is applied in index.js via express-rate-limit
// (loginLimiter middleware is mounted on /api/auth/login before this router).

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await User.findOne({ username: username.trim().toLowerCase(), is_active: true });
    // Use async bcrypt.compare — compareSync blocks the event loop for ~100-300 ms
    const passwordValid = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !passwordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const company = await Company.findById(user.company_id);

    const token = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        company_id: user.company_id ? user.company_id.toString() : null,
        company_name: company?.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        company_name: company?.name,
        subscription_plan: company?.subscription_plan,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/clerk-exchange
// Verifies a Clerk session token and returns a LocalWheels JWT for the matching user.
// Requires CLERK_SECRET_KEY env var. Matches by email address.
router.post('/clerk-exchange', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const clerkToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!clerkToken) return res.status(401).json({ error: 'Clerk session token required' });

    if (!process.env.CLERK_SECRET_KEY) {
      return res.status(503).json({ error: 'Clerk is not configured on this server (CLERK_SECRET_KEY missing)' });
    }

    const { createClerkClient } = require('@clerk/backend');
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    let clerkUserId;
    try {
      const payload = await clerk.verifyToken(clerkToken);
      clerkUserId = payload.sub;
    } catch {
      return res.status(401).json({ error: 'Invalid or expired Clerk session token' });
    }

    const clerkUser = await clerk.users.getUser(clerkUserId);
    const email = clerkUser.emailAddresses?.[0]?.emailAddress;
    if (!email) return res.status(400).json({ error: 'Clerk user has no email address' });

    const user = await User.findOne({ email: email.toLowerCase(), is_active: true });
    if (!user) {
      return res.status(404).json({ error: `No LocalWheels account found for ${email}. Contact your administrator.` });
    }

    const company = await Company.findById(user.company_id);
    const token = jwt.sign(
      {
        id: user._id.toString(),
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        company_id: user.company_id ? user.company_id.toString() : null,
        company_name: company?.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        company_name: company?.name,
        subscription_plan: company?.subscription_plan,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const company = await Company.findById(user.company_id);
    res.json({ ...user.toObject(), company_name: company?.name, subscription_plan: company?.subscription_plan });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
