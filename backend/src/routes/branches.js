const express = require('express');
const mongoose = require('mongoose');
const Branch = require('../models/Branch');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const ObjId    = id => new mongoose.Types.ObjectId(id);
const isValidId = id => id && mongoose.Types.ObjectId.isValid(id);

// ── GET /api/branches/user — branches the current user can access ─────────────
router.get('/user', authenticate, async (req, res, next) => {
  try {
    let branches;
    if (req.user.role === 'superadmin' || req.user.role === 'admin') {
      branches = await Branch.find({ company_id: req.user.company_id, is_active: true }).sort('branch_name');
    } else {
      const user = await User.findById(req.user.id).select('branch_ids company_id');
      if (user.branch_ids && user.branch_ids.length > 0) {
        branches = await Branch.find({ _id: { $in: user.branch_ids }, is_active: true }).sort('branch_name');
      } else {
        // User has no specific branch assignments yet (e.g. auto-created via Clerk) —
        // show all active branches in their company so they can proceed to the dashboard.
        const companyId = user.company_id || req.user.company_id;
        branches = await Branch.find({ company_id: companyId, is_active: true }).sort('branch_name');
      }
    }
    // res.json triggers toJSON() which includes virtual `id`
    res.json(branches);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/branches — all branches with user count (admin only) ─────────────
router.get('/', authenticate, requireRole('admin', 'superadmin'), async (req, res, next) => {
  try {
    const branches = await Branch.find({ company_id: req.user.company_id }).sort('branch_name');
    const userCounts = await User.aggregate([
      { $match: { company_id: ObjId(req.user.company_id) } },
      { $unwind: '$branch_ids' },
      { $group: { _id: '$branch_ids', user_count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(userCounts.map(u => [u._id.toString(), u.user_count]));

    res.json(branches.map(b => ({
      ...b.toObject({ virtuals: true }),  // ← include virtual `id`
      user_count: countMap[b._id.toString()] || 0,
    })));
  } catch (err) {
    next(err);
  }
});

// ── POST /api/branches ────────────────────────────────────────────────────────
router.post('/', authenticate, requireRole('admin', 'superadmin'), async (req, res, next) => {
  try {
    const { branch_name, location, phone, address } = req.body;
    if (!branch_name) return res.status(400).json({ error: 'branch_name required' });

    const branch = await Branch.create({
      company_id: req.user.company_id,
      branch_name: branch_name.trim().toUpperCase(),
      location, phone, address,
    });
    res.status(201).json({ ...branch.toObject({ virtuals: true }) });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/branches/:id ─────────────────────────────────────────────────────
router.put('/:id', authenticate, requireRole('admin', 'superadmin'), async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid branch ID' });
    const { branch_name, location, phone, address, is_active } = req.body;
    // Build $set from only the fields the caller actually sent — prevents
    // undefined values from overwriting existing data when a field is omitted.
    const $set = {};
    if (branch_name !== undefined) $set.branch_name = branch_name;
    if (location    !== undefined) $set.location    = location;
    if (phone       !== undefined) $set.phone       = phone;
    if (address     !== undefined) $set.address     = address;
    if (is_active   !== undefined) $set.is_active   = is_active;
    const updated = await Branch.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set }
    );
    if (!updated) return res.status(404).json({ error: 'Branch not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/branches/:id — SOFT DELETE ───────────────────────────────────
//
// Design decision: branches are NEVER hard-deleted.
//
// Rationale
//   • All historical documents (shipments, PODs, payments, route-expenses) carry
//     a branch_id foreign key. Removing the branch document would orphan that
//     data and break audit trails, financial reports, and LR lookups.
//
// Behaviour
//   • Sets is_active=false on the branch document.
//   • The branch is hidden from GET /api/branches/user (the user-facing selector).
//   • The branch still appears in GET /api/branches (admin list) with is_active=false,
//     so admins can see and potentially restore it.
//   • Existing shipments / payments / PODs remain fully queryable.
//
// Restoration
//   • PUT /api/branches/:id with { is_active: true } re-activates the branch.
//
router.delete('/:id', authenticate, requireRole('admin', 'superadmin'), async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid branch ID' });
    const updated = await Branch.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { is_active: false }
    );
    if (!updated) return res.status(404).json({ error: 'Branch not found' });
    res.json({ success: true, soft_deleted: true });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/branches/users/:branchId ─────────────────────────────────────────
router.get('/users/:branchId', authenticate, requireRole('admin', 'superadmin'), async (req, res, next) => {
  try {
    const users = await User.find({
      company_id: req.user.company_id,
      branch_ids: req.params.branchId,
    }).select('username full_name role email');
    res.json(users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
