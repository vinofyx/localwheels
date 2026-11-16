const express  = require('express');
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const User     = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

function isSuperAdmin(role) {
  return role === 'superadmin' || role === 'super_admin';
}

// ── GET /api/users ────────────────────────────────────────────────────────────
router.get('/', authenticate, requireRole('admin', 'superadmin'), async (req, res, next) => {
  try {
    const query = isSuperAdmin(req.user.role) && !req.user.company_id
      ? {}
      : { company_id: req.user.company_id };

    const users = await User.find(query)
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

    const validRoles = ['superadmin', 'admin', 'manager', 'staff', 'operator', 'driver'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` });
    }

    // Only existing superadmins can provision new superadmins
    if (isSuperAdmin(role) && !isSuperAdmin(req.user.role)) {
      await AuditLog.create({
        event_type: 'privilege_escalation_attempt',
        performed_by: req.user.id,
        performed_by_username: req.user.username,
        company_id: req.user.company_id,
        details: { attempted_role: role, target_username: username },
        ip_address: req.ip,
      });
      return res.status(403).json({ error: 'Only superadmin can create superadmin accounts' });
    }

    // Check duplicate username across system
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

    // Audit log
    await AuditLog.create({
      event_type: ['admin', 'superadmin'].includes(user.role) ? 'admin_created' : 'user_created',
      performed_by: req.user.id,
      performed_by_username: req.user.username,
      target_user: user._id,
      target_username: user.username,
      company_id: req.user.company_id,
      details: { role: user.role, branch_ids },
      ip_address: req.ip,
    });

    res.status(201).json({ id: user._id.toString(), _id: user._id.toString(), username: user.username, role: user.role });
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

    const validRoles = ['superadmin', 'admin', 'manager', 'staff', 'operator', 'driver'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` });
    }

    // 1. Prevent self-promotion or self-tampering
    if (req.params.id === req.user.id) {
      if (role && role !== req.user.role) {
        await AuditLog.create({
          event_type: 'privilege_escalation_attempt',
          performed_by: req.user.id,
          performed_by_username: req.user.username,
          company_id: req.user.company_id,
          details: { attempted_role: role, reason: 'Self-promotion blocked' },
          ip_address: req.ip,
        });
        return res.status(403).json({ error: 'Cannot modify your own role' });
      }
      if (is_active !== undefined && is_active === false) {
        return res.status(400).json({ error: 'Cannot deactivate your own account' });
      }
      if (branch_ids !== undefined) {
        return res.status(403).json({ error: 'Users cannot change their own branch assignments' });
      }
    }

    // 2. Locate target user with company isolation
    const query = isSuperAdmin(req.user.role) && !req.user.company_id
      ? { _id: req.params.id }
      : { _id: req.params.id, company_id: req.user.company_id };

    const targetUser = await User.findOne(query);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // 3. Superadmin privilege checks
    if (isSuperAdmin(targetUser.role) && !isSuperAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Only superadmin can modify a superadmin account' });
    }
    if (role && isSuperAdmin(role) && !isSuperAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Only superadmin can promote a user to superadmin' });
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

    const updated = await User.findByIdAndUpdate(targetUser._id, { $set }, { new: true });

    // 4. Audit logging
    if (role && role !== targetUser.role) {
      await AuditLog.create({
        event_type: 'role_changed',
        performed_by: req.user.id,
        performed_by_username: req.user.username,
        target_user: targetUser._id,
        target_username: targetUser.username,
        company_id: req.user.company_id,
        details: { old_role: targetUser.role, new_role: role },
        ip_address: req.ip,
      });
    }

    if (is_active !== undefined && is_active !== targetUser.is_active) {
      await AuditLog.create({
        event_type: is_active ? 'user_activated' : 'user_deactivated',
        performed_by: req.user.id,
        performed_by_username: req.user.username,
        target_user: targetUser._id,
        target_username: targetUser.username,
        company_id: req.user.company_id,
        details: { old_status: targetUser.is_active, new_status: is_active },
        ip_address: req.ip,
      });
    }

    res.json({ success: true, user: { id: updated._id.toString(), username: updated.username, role: updated.role } });
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

    const query = isSuperAdmin(req.user.role) && !req.user.company_id
      ? { _id: req.params.id }
      : { _id: req.params.id, company_id: req.user.company_id };

    const targetUser = await User.findOne(query);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (isSuperAdmin(targetUser.role) && !isSuperAdmin(req.user.role)) {
      return res.status(403).json({ error: 'Cannot deactivate a superadmin account' });
    }

    await User.findByIdAndUpdate(targetUser._id, { is_active: false });

    // Invalidate session immediately
    await User.findByIdAndUpdate(targetUser._id, { lastLogoutAt: new Date() });

    await AuditLog.create({
      event_type: 'user_deactivated',
      performed_by: req.user.id,
      performed_by_username: req.user.username,
      target_user: targetUser._id,
      target_username: targetUser.username,
      company_id: req.user.company_id,
      details: { action: 'soft_delete' },
      ip_address: req.ip,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
