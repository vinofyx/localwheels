const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
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

    const hash = bcrypt.hashSync(password, 10);
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
    const { full_name, email, phone, role, is_active, branch_ids, password } = req.body;

    const validRoles = ['superadmin', 'admin', 'manager', 'staff'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` });
    }

    const update = { full_name, email, phone, role, is_active };
    if (branch_ids) update.branch_ids = branch_ids;
    if (password)   update.password = bcrypt.hashSync(password, 10);

    await User.findOneAndUpdate({ _id: req.params.id, company_id: req.user.company_id }, update);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/users/:id ─────────────────────────────────────────────────────
router.delete('/:id', authenticate, requireRole('admin', 'superadmin'), async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    await User.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { is_active: false }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
