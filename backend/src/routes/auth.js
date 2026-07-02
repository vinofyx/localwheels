const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Shared helper — build LW JWT + user profile response shape
function buildAuthResponse(user, company) {
  const token = jwt.sign(
    {
      id:           user._id.toString(),
      username:     user.username,
      full_name:    user.full_name,
      role:         user.role,
      company_id:   user.company_id ? user.company_id.toString() : null,
      company_name: company?.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    token,
    user: {
      id:                user._id,
      username:          user.username,
      full_name:         user.full_name,
      email:             user.email,
      role:              user.role,
      company_id:        user.company_id,
      company_name:      company?.name,
      subscription_plan: company?.subscription_plan,
      authProvider:      user.authProvider || 'local',
    },
  };
}

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

// Rate limiting for /api/auth/login is applied in index.js via express-rate-limit
// (loginLimiter middleware is mounted on /api/auth/login before this router).

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await User.findOne({ username: username.trim().toLowerCase(), is_active: true });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Clerk-only accounts have no local password
    if (!user.password || user.authProvider === 'clerk') {
      return res.status(401).json({ error: 'This account uses Clerk authentication. Please sign in with Clerk.' });
    }

    // Use async bcrypt.compare — compareSync blocks the event loop for ~100-300 ms
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const company = await Company.findById(user.company_id);
    res.json(buildAuthResponse(user, company));
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/clerk-exchange
//
// Full user synchronization flow:
//   1. Verify the Clerk session token server-side using CLERK_SECRET_KEY (never trust client email)
//   2. Fetch the verified Clerk user profile to get the canonical email
//   3. Find existing LW user by clerkId (fastest path)
//   4. Else find by email → auto-attach clerkId (migration path for existing users)
//   5. Else auto-create a new LW user from the Clerk profile (first-time Clerk login)
//   6. Issue a LocalWheels JWT and return the user profile
router.post('/clerk-exchange', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const clerkToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!clerkToken) {
      return res.status(401).json({ error: 'Clerk session token required' });
    }

    if (!process.env.CLERK_SECRET_KEY) {
      return res.status(503).json({ error: 'Clerk is not configured on this server' });
    }

    const { createClerkClient } = require('@clerk/backend');
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    // ── 1. Verify Clerk JWT server-side ──────────────────────────────────────
    let clerkUserId;
    try {
      const payload = await clerk.verifyToken(clerkToken);
      clerkUserId = payload.sub;
    } catch {
      return res.status(401).json({ error: 'Unable to verify Clerk session. Please sign in again.' });
    }

    // ── 2. Fetch canonical Clerk profile (server-side — never trust client) ─
    let clerkUser;
    try {
      clerkUser = await clerk.users.getUser(clerkUserId);
    } catch {
      return res.status(401).json({ error: 'Unable to verify Clerk session. Please sign in again.' });
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
    const clerkFullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null;

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

        // Auto-link: attach clerkId to the existing user
        await User.findByIdAndUpdate(lwUser._id, {
          clerkId:       clerkUserId,
          authProvider:  lwUser.authProvider === 'local' ? 'local' : 'clerk',
          emailVerified: emailVerified,
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
        emailVerified: emailVerified,
        ...(clerkFullName && !lwUser.full_name ? { full_name: clerkFullName } : {}),
      });
      lwUser = await User.findById(lwUser._id);
    }

    // ── 5. Auto-create LW user (first-time Clerk login, no existing account) ─
    let isNewUser = false;
    if (!lwUser) {
      // Find which company to attach the new user to.
      // Strategy: use the only company if there is exactly one, otherwise leave null
      // (superadmin can assign later). This handles both pilot (1 company) and
      // multi-tenant scenarios safely.
      const companies = await Company.find({ is_active: true }).select('_id').lean();
      const defaultCompanyId = companies.length === 1 ? companies[0]._id : null;

      const username = await deriveUsername(canonicalEmail);

      lwUser = await User.create({
        username:      username,
        email:         canonicalEmail,
        full_name:     clerkFullName || username,
        role:          'staff',
        is_active:     true,
        company_id:    defaultCompanyId,
        clerkId:       clerkUserId,
        authProvider:  'clerk',
        emailVerified: emailVerified,
        lastLogin:     new Date(),
      });

      isNewUser = true;
    }

    if (!lwUser.is_active) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact your administrator.' });
    }

    // ── 6. Issue LocalWheels JWT ──────────────────────────────────────────────
    const company = lwUser.company_id ? await Company.findById(lwUser.company_id) : null;
    const response = buildAuthResponse(lwUser, company);

    return res.status(isNewUser ? 201 : 200).json({
      ...response,
      message: isNewUser ? 'Account created successfully.' : 'Welcome back.',
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
