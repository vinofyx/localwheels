const express  = require('express');
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const User     = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/users ────────────────────────────────────────────────────────────
router.get('/', authenticate, requireRole('admin', 'superadmin'), async (req, res, next) => {
  try {
    const users = await User.find({ company_id: req.user.company_id })
      .select('-password')
      .populate('branch_ids', 'branch_name')
      .sort({ createdAt: -1 })
      .lean();

    const data = users.map(u => ({
      ...u,
      id:       u._id.toString(),                          // ← normalised id
      branches: u.branch_ids?.map(b => b.branch_name).join(', ') || '',
    }));

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/users ───────────────────────────────────────────────────────────
router.post('/', authenticate, requireRole('admin', 'superadmin'), async (req, res, next) => {
  try {
    const { username, password, full_name, email, phone, role, branch_ids } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const validRoles = ['superadmin', 'admin', 'manager', 'staff'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` });
    }

    // Check duplicate username within company
    const existing = await User.findOne({ username: username.trim().toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Username already exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      company_id: req.user.company_id,
      username:   username.toLowerCase().trim(),
      password:   hash,
      full_name,
      email,
      phone,
      role:       role || 'staff',
      branch_ids: branch_ids || [],
    });

    res.status(201).json({ id: user._id.toString(), _id: user._id.toString(), username: user.username });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/users/:id ────────────────────────────────────────────────────────
router.put('/:id', authenticate, requireRole('admin', 'superadmin'), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    const { full_name, email, phone, role, is_active, branch_ids, password } = req.body;

    const validRoles = ['superadmin', 'admin', 'manager', 'staff'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` });
    }

    // Only include fields actually sent — avoids writing undefined over existing data
    const $set = {};
    if (full_name  !== undefined) $set.full_name  = full_name;
    if (email      !== undefined) $set.email      = email;
    if (phone      !== undefined) $set.phone      = phone;
    if (role       !== undefined) $set.role       = role;
    if (is_active  !== undefined) $set.is_active  = is_active;
    if (branch_ids !== undefined) $set.branch_ids = branch_ids;
    if (password)                 $set.password   = await bcrypt.hash(password, 10);

    const updated = await User.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set }
    );
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/users/:id ─────────────────────────────────────────────────────
router.delete('/:id', authenticate, requireRole('admin', 'superadmin'), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    const updated = await User.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { is_active: false }
    );
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
