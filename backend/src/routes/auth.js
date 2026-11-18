const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const { authenticate } = require('../middleware/auth');
const { bootstrapSuperAdmin, getBootstrapStatus } = require('../services/adminBootstrap');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'localwheels-dev-secret-key-change-in-production-123456';

// ── GET /api/auth/bootstrap-status ──────────────────────────────────────────
router.get('/bootstrap-status', async (_req, res, next) => {
  try {
    const status = await getBootstrapStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/bootstrap-superadmin ──────────────────────────────────────
router.post('/bootstrap-superadmin', async (req, res, next) => {
  try {
    const { bootstrap_secret, username, password, email, full_name, company_name } = req.body;
    const ip_address = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const result = await bootstrapSuperAdmin({
      secret: bootstrap_secret,
      username,
      password,
      email,
      full_name,
      company_name,
      ip_address,
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.message.includes('Invalid bootstrap secret')) {
      return res.status(403).json({ error: err.message });
    }
    if (err.message.includes('already') || err.message.includes('disabled') || err.message.includes('locked')) {
      return res.status(409).json({ error: err.message });
    }
    res.status(400).json({ error: err.message });
  }
});

// ── POST /api/auth/login (Standard / Legacy JWT Login) ─────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }

    const user = await User.findOne({
      username: username.toLowerCase().trim(),
    });

    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.is_active === false) {
      return res.status(403).json({ error: 'Account has been deactivated' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, role: user.role, company_id: user.company_id, authTime: Date.now() },
      JWT_SECRET,
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    const company = user.company_id ? await Company.findById(user.company_id) : null;

    res.json({
      token,
      user: {
        id:                user._id.toString(),
        _id:               user._id.toString(),
        username:          user.username,
        full_name:         user.full_name,
        email:             user.email,
        role:              user.role,
        company_id:        user.company_id?.toString() || null,
        company_name:      company?.name,
        subscription_plan: company?.subscription_plan,
        authProvider:      user.authProvider,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
        const userId = decoded.id || decoded._id || decoded.sub;
        if (userId) {
          await User.findByIdAndUpdate(userId, { lastLogoutAt: new Date() });
        }
      } catch {
        // Token might already be expired or invalid
      }
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

// Lazy-initialised singletons — created once, reused across requests
let _clerkClient = null;

function getClerkClient() {
  if (!_clerkClient) {
    const { createClerkClient } = require('@clerk/backend');
    const secretKey = (process.env.CLERK_SECRET_KEY || '').trim();
    _clerkClient = createClerkClient({ secretKey });
  }
  return _clerkClient;
}

const { verifyClerkSessionToken } = require('../utils/clerkAuth');

// Derive a unique username from an email address
async function deriveUsername(email) {
  const base = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 30) || 'user';

  let candidate = base;
  let suffix = 0;
  while (await User.exists({ username: candidate })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
  }
  return candidate;
}

// POST /api/auth/clerk-exchange
//
// User synchronization flow (called once per session, immediately after Clerk sign-in):
//   1. Verify the Clerk session token server-side using CLERK_SECRET_KEY
//   2. Fetch the verified Clerk user profile to get the canonical email
//   3. Find existing LW user by clerkId (fastest path)
//   4. Else find by email → auto-attach clerkId (migration path for existing users)
//   5. Else auto-create a new LW user from the Clerk profile (first-time Clerk login)
//   6. Return the user profile — NO LocalWheels JWT is issued.
//      All subsequent API requests carry the Clerk session token directly.
router.post('/clerk-exchange', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const clerkToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : ((req.body?.token || req.body?.clerkToken || '') + '').trim() || null;

    if (!clerkToken || clerkToken === 'null' || clerkToken === 'undefined') {
      return res.status(401).json({ error: 'Clerk session token required' });
    }

    const secretKey = (process.env.CLERK_SECRET_KEY || '').trim();
    const jwtKey = (process.env.CLERK_JWT_KEY || '').trim();

    if (!secretKey && !jwtKey) {
      return res.status(503).json({ error: 'Clerk is not configured on this server' });
    }

    const clerk = getClerkClient();

    // ── 1. Verify Clerk JWT server-side ──────────────────────────────────────
    let clerkUserId;
    try {
      const payload = await verifyClerkSessionToken(clerkToken, req);
      clerkUserId = payload.sub;
    } catch (err) {
      console.error('❌ [clerk-exchange] Token verification failed:', {
        message: err.message,
        reason:  err.reason || '',
        code:    err.code || '',
        action:  err.action || '',
      });
      return res.status(401).json({
        error: 'Unable to verify Clerk session. Please sign in again.',
        code: err.code || 'CLERK_TOKEN_VERIFICATION_FAILED',
        details: IS_DEV ? err.message : undefined,
      });
    }

    // ── 2. Fetch canonical Clerk profile (server-side — never trust client) ─
    let clerkUser;
    try {
      clerkUser = await clerk.users.getUser(clerkUserId);
    } catch (err) {
      console.error('❌ [clerk-exchange] clerk.users.getUser failed for clerkUserId:', clerkUserId, err?.message);
      return res.status(502).json({ error: 'Failed to retrieve profile from Clerk. Please try again.' });
    }

    const primaryEmail = clerkUser.emailAddresses?.find(
      e => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress;

    if (!primaryEmail) {
      return res.status(400).json({ error: 'Your Clerk account has no verified email address.' });
    }

    const emailVerified = clerkUser.emailAddresses?.find(
      e => e.emailAddress === primaryEmail
    )?.verification?.status === 'verified';

    const canonicalEmail = primaryEmail.toLowerCase();
    const clerkFullName  = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;

    // ── 3. Find by clerkId (returning user, fastest path) ────────────────────
    let lwUser = await User.findOne({ clerkId: clerkUserId });

    // ── 4. Find by email (existing LW user — auto-link clerkId) ─────────────
    if (!lwUser) {
      lwUser = await User.findOne({ email: canonicalEmail, is_active: true });

      if (lwUser) {
        // Prevent account hijacking: if this user already has a DIFFERENT clerkId, reject
        if (lwUser.clerkId && lwUser.clerkId !== clerkUserId) {
          return res.status(409).json({
            error: 'This email is already linked to a different Clerk account. Contact your administrator.',
          });
        }

        await User.findByIdAndUpdate(lwUser._id, {
          clerkId:       clerkUserId,
          authProvider:  'clerk',
          emailVerified,
          lastLogin:     new Date(),
          ...(clerkFullName && !lwUser.full_name ? { full_name: clerkFullName } : {}),
        });
        lwUser = await User.findById(lwUser._id);
      }
    } else {
      // Returning Clerk user — verify email hasn't changed to prevent spoofing
      if (lwUser.email && lwUser.email.toLowerCase() !== canonicalEmail) {
        return res.status(409).json({
          error: 'Clerk email address has changed. Contact your administrator to update your account.',
        });
      }
      await User.findByIdAndUpdate(lwUser._id, {
        lastLogin:     new Date(),
        emailVerified,
        ...(clerkFullName && !lwUser.full_name ? { full_name: clerkFullName } : {}),
      });
      lwUser = await User.findById(lwUser._id);
    }

    // ── 5. Auto-create LW user (first-time Clerk login, no existing account) ─
    let isNewUser = false;
    if (!lwUser) {
      const companies = await Company.find({ is_active: true }).select('_id setup_completed').lean();
      const defaultCompanyId = companies.length === 1 ? companies[0]._id : null;

      const username = await deriveUsername(canonicalEmail);

      // Secure role assignment: all new Clerk signups strictly default to 'staff'.
      // Administrative roles require explicit provisioning by an existing administrator or bootstrap.
      const initialRole = 'staff';

      lwUser = await User.create({
        username,
        email:         canonicalEmail,
        full_name:     clerkFullName || username,
        role:          initialRole,
        is_active:     true,
        company_id:    defaultCompanyId,
        clerkId:       clerkUserId,
        authProvider:  'clerk',
        emailVerified,
        lastLogin:     new Date(),
      });
      isNewUser = true;
    } else if (!lwUser.company_id) {
      // Connect unassigned returning user to the single active company if one exists
      const companies = await Company.find({ is_active: true }).select('_id').lean();
      if (companies.length === 1) {
        await User.findByIdAndUpdate(lwUser._id, { company_id: companies[0]._id });
        lwUser.company_id = companies[0]._id;
      }
    }

    if (!lwUser.is_active) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact your administrator.' });
    }

    // ── 6. Return user profile — no LW JWT issued ────────────────────────────
    // All subsequent API requests carry the Clerk session token directly.
    // The authenticate middleware in middleware/auth.js verifies it on every request.
    const company = lwUser.company_id ? await Company.findById(lwUser.company_id) : null;

    return res.status(isNewUser ? 201 : 200).json({
      message: isNewUser ? 'Account created successfully.' : 'Welcome back.',
      user: {
        id:                lwUser._id,
        username:          lwUser.username,
        full_name:         lwUser.full_name,
        email:             lwUser.email,
        role:              lwUser.role,
        company_id:        lwUser.company_id,
        company_name:      company?.name,
        subscription_plan: company?.subscription_plan,
        authProvider:      lwUser.authProvider,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — return current authenticated user's profile
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
