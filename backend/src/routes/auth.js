const express = require('express');
const User = require('../models/User');
const Company = require('../models/Company');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Lazy-initialised singletons — created once, reused across requests
let _clerkClient = null;
let _verifyToken  = null;

function getClerkClient() {
  if (!_clerkClient) {
    const { createClerkClient } = require('@clerk/backend');
    _clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  }
  return _clerkClient;
}

function getVerifyToken() {
  if (!_verifyToken) {
    _verifyToken = require('@clerk/backend').verifyToken;
  }
  return _verifyToken;
}

// Origins allowed to produce valid Clerk session tokens.
const CLERK_AUTHORIZED_PARTIES = process.env.CLERK_AUTHORIZED_PARTIES
  ? process.env.CLERK_AUTHORIZED_PARTIES.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'];

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
    const clerkToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!clerkToken || clerkToken === 'null' || clerkToken === 'undefined') {
      return res.status(401).json({ error: 'Clerk session token required' });
    }

    if (!process.env.CLERK_SECRET_KEY) {
      return res.status(503).json({ error: 'Clerk is not configured on this server' });
    }

    const clerk       = getClerkClient();
    const verifyToken = getVerifyToken();

    // ── 1. Verify Clerk JWT server-side ──────────────────────────────────────
    let clerkUserId;
    try {
      const payload = await verifyToken(clerkToken, {
        secretKey:         process.env.CLERK_SECRET_KEY,
        publishableKey:    process.env.CLERK_PUBLISHABLE_KEY,
        authorizedParties: CLERK_AUTHORIZED_PARTIES,
      });
      clerkUserId = payload.sub;
    } catch {
      return res.status(401).json({ error: 'Unable to verify Clerk session. Please sign in again.' });
    }

    // ── 2. Fetch canonical Clerk profile (server-side — never trust client) ─
    let clerkUser;
    try {
      clerkUser = await clerk.users.getUser(clerkUserId);
    } catch {
      return res.status(401).json({ error: 'Unable to load Clerk user profile.' });
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
      const companies = await Company.find({ is_active: true }).select('_id').lean();
      const defaultCompanyId = companies.length === 1 ? companies[0]._id : null;

      const username = await deriveUsername(canonicalEmail);

      lwUser = await User.create({
        username,
        email:         canonicalEmail,
        full_name:     clerkFullName || username,
        role:          'staff',
        is_active:     true,
        company_id:    defaultCompanyId,
        clerkId:       clerkUserId,
        authProvider:  'clerk',
        emailVerified,
        lastLogin:     new Date(),
      });
      isNewUser = true;
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
