const { verifyToken } = require('@clerk/backend');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const IS_PROD = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || 'localwheels-dev-secret-key-change-in-production-123456';

// Authorized origins for Clerk token verification in development.
const DEV_AUTHORIZED_PARTIES = [
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:8083',
  'http://localhost:3000',
];

// Verify a Clerk JWT or local JWT and load the matching LocalWheels user.
// Sets req.user = { id, _id, username, full_name, name, role, company_id, branch_id, branch_ids, driver_id }
async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.slice(7);

  // 1. Try local JWT verification first (standard HS256 token from /api/auth/login)
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && (decoded.id || decoded._id || decoded.sub)) {
      const userId = decoded.id || decoded._id || decoded.sub;
      const user = await User.findOne({ _id: userId, is_active: true })
        .select('-password')
        .lean();

      if (user) {
        req.user = {
          id:         user._id.toString(),
          _id:        user._id.toString(),
          username:   user.username,
          full_name:  user.full_name || user.username,
          name:       user.full_name || user.username,
          role:       user.role,
          company_id: user.company_id?.toString() || null,
          branch_id:  user.branch_ids?.[0]?.toString() || null,
          branch_ids: user.branch_ids ? user.branch_ids.map(b => b.toString()) : [],
          driver_id:  user.driver_id?.toString() || null,
        };
        return next();
      }
    }
  } catch {
    // Not a valid local JWT or expired — proceed to check Clerk
  }

  // 2. If not local JWT, verify via Clerk if CLERK_SECRET_KEY is configured
  if (!process.env.CLERK_SECRET_KEY) {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }

  let clerkUserId;
  try {
    const authorizedParties = IS_PROD
      ? (process.env.CLERK_AUTHORIZED_PARTIES
          ? process.env.CLERK_AUTHORIZED_PARTIES.split(',').map(s => s.trim())
          : undefined)
      : DEV_AUTHORIZED_PARTIES;

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      authorizedParties,
    });
    clerkUserId = payload.sub;
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }

  // Load the LocalWheels user by Clerk ID
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
      _id:        user._id.toString(),
      username:   user.username,
      full_name:  user.full_name || user.username,
      name:       user.full_name || user.username,
      role:       user.role,
      company_id: user.company_id?.toString() || null,
      branch_id:  user.branch_ids?.[0]?.toString() || null,
      branch_ids: user.branch_ids ? user.branch_ids.map(b => b.toString()) : [],
      driver_id:  user.driver_id?.toString() || null,
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
  const branchId = req.query.branch_id || req.body.branch_id || req.params.branch_id || req.headers['x-branch-id'] || req.user.branch_id;
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
