const jwt = require('jsonwebtoken');
const User = require('../models/User');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
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
      // User has no explicit branch assignments yet (e.g. auto-created via Clerk).
      // Fall back to company-level access: verify the branch belongs to the user's company.
      const Branch = require('../models/Branch');
      const branch = await Branch.findOne({
        _id: branchId,
        company_id: user.company_id || req.user.company_id,
        is_active: true,
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
