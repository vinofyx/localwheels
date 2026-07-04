const { verifyToken } = require('@clerk/backend');
const User = require('../models/User');

const IS_PROD = process.env.NODE_ENV === 'production';

// Authorized origins for Clerk token verification in development.
// In production, set CLERK_AUTHORIZED_PARTIES env var (comma-separated).
const DEV_AUTHORIZED_PARTIES = ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'];

// Verify a Clerk JWT and load the matching LocalWheels user.
// Sets req.user = { id, username, full_name, role, company_id }
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const clerkToken = header.slice(7);

  if (!process.env.CLERK_SECRET_KEY) {
    return res.status(503).json({ error: 'Authentication not configured on this server' });
  }

  // Verify Clerk JWT server-side. JWKS is fetched once and cached automatically.
  let clerkUserId;
  try {
    const authorizedParties = IS_PROD
      ? (process.env.CLERK_AUTHORIZED_PARTIES
          ? process.env.CLERK_AUTHORIZED_PARTIES.split(',').map(s => s.trim())
          : undefined)
      : DEV_AUTHORIZED_PARTIES;

    const payload = await verifyToken(clerkToken, {
      secretKey:      process.env.CLERK_SECRET_KEY,
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
      authorizedParties,
    });
    clerkUserId = payload.sub;
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }

  // Load the LocalWheels user by Clerk ID.
  // The user must exist (created by POST /api/auth/clerk-exchange on first sign-in).
  try {
    const user = await User.findOne({ clerkId: clerkUserId, is_active: true })
      .select('-password')
      .lean();

    if (!user) {
      return res.status(401).json({
        error: 'Account not found. Complete sign-in to register your account.',
        code: 'USER_NOT_SYNCED',
      });
    }

    req.user = {
      id:         user._id.toString(),
      username:   user.username,
      full_name:  user.full_name,
      role:       user.role,
      company_id: user.company_id?.toString() || null,
    };
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

async function requireBranchAccess(req, res, next) {
  const branchId = req.query.branch_id || req.body.branch_id || req.params.branch_id;
  if (!branchId) return res.status(400).json({ error: 'branch_id required' });

  if (req.user.role === 'superadmin' || req.user.role === 'admin') {
    req.branchId = branchId;
    return next();
  }

  try {
    const user = await User.findById(req.user.id).select('branch_ids company_id');
    if (!user) return res.status(401).json({ error: 'User not found' });

    let hasAccess;
    if (user.branch_ids && user.branch_ids.length > 0) {
      hasAccess = user.branch_ids.some(id => id.toString() === branchId);
    } else {
      // User has no explicit branch assignments (e.g. auto-created via Clerk).
      // Fall back to company-level access: verify the branch belongs to the user's company.
      const Branch = require('../models/Branch');
      const branch = await Branch.findOne({
        _id:        branchId,
        company_id: user.company_id || req.user.company_id,
        is_active:  true,
      }).lean();
      hasAccess = !!branch;
    }

    if (!hasAccess) return res.status(403).json({ error: 'No access to this branch' });
    req.branchId = branchId;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate, requireRole, requireBranchAccess };
