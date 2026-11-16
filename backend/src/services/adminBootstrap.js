const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Company = require('../models/Company');
const BootstrapLock = require('../models/BootstrapLock');
const AuditLog = require('../models/AuditLog');

const BOOTSTRAP_LOCK_NAME = 'superadmin_bootstrap';

function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Checks whether superadmin bootstrap is allowed.
 * Returns { allowed: boolean, reason?: string }
 */
async function getBootstrapStatus() {
  const lock = await BootstrapLock.findOne({ lock_name: BOOTSTRAP_LOCK_NAME }).lean();
  if (lock && lock.is_completed) {
    return {
      allowed: false,
      reason: 'Bootstrap has already been completed and is permanently disabled.',
      completed_at: lock.completed_at,
    };
  }

  // Check if any superadmin already exists
  const superadminExists = await User.exists({
    role: { $in: ['superadmin', 'super_admin'] },
  });

  if (superadminExists) {
    // If superadmin exists, ensure lock is permanently set
    await BootstrapLock.findOneAndUpdate(
      { lock_name: BOOTSTRAP_LOCK_NAME },
      { $set: { is_completed: true, completed_at: new Date() } },
      { upsert: true }
    );
    return {
      allowed: false,
      reason: 'A superadmin already exists in the system. Bootstrap is disabled.',
    };
  }

  return { allowed: true };
}

/**
 * Atomically provisions the initial superadmin.
 * Fails permanently if bootstrap has already completed or secret is invalid.
 */
async function bootstrapSuperAdmin({
  secret,
  username,
  password,
  email,
  full_name,
  company_name,
  ip_address = '127.0.0.1',
}) {
  const configuredSecret = process.env.BOOTSTRAP_SECRET;
  if (!configuredSecret || configuredSecret.trim().length < 16) {
    throw new Error('Server BOOTSTRAP_SECRET is not configured or too weak. Configure a minimum 16-character secret.');
  }

  if (!secret || !safeCompare(secret, configuredSecret)) {
    // Log security violation without leaking any credential values
    await AuditLog.create({
      event_type: 'security_violation',
      performed_by_username: 'anonymous',
      details: { attempted_action: 'bootstrap_superadmin', reason: 'Invalid secret attempt' },
      ip_address,
    });
    throw new Error('Invalid bootstrap secret.');
  }

  if (!username || !password) {
    throw new Error('Username and password are required.');
  }

  // 1. Check status
  const status = await getBootstrapStatus();
  if (!status.allowed) {
    throw new Error(status.reason);
  }

  // 2. Atomic lock acquisition (compare-and-swap)
  // Ensure the lock record exists initialized to is_completed: false if brand new
  await BootstrapLock.updateOne(
    { lock_name: BOOTSTRAP_LOCK_NAME },
    { $setOnInsert: { lock_name: BOOTSTRAP_LOCK_NAME, is_completed: false } },
    { upsert: true }
  );

  const lock = await BootstrapLock.findOneAndUpdate(
    { lock_name: BOOTSTRAP_LOCK_NAME, is_completed: false },
    {
      $set: {
        is_completed: true,
        completed_at: new Date(),
        completed_by_ip: ip_address,
      },
    },
    { new: true }
  );

  if (!lock) {
    // Another concurrent request completed bootstrap first or lock is active
    throw new Error('Bootstrap already locked or concurrent provisioning in progress.');
  }

  try {
    // 3. Resolve or create primary company
    let company = await Company.findOne({ is_active: true }).sort({ createdAt: 1 });
    if (!company) {
      company = await Company.create({
        name: company_name || 'Primary Logistics',
        setup_completed: true,
        is_active: true,
      });
    }

    // 4. Check if username is already taken
    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    let superadminUser;

    const hashedPassword = await bcrypt.hash(password, 12);

    if (existingUser) {
      // Promote existing user to superadmin
      superadminUser = await User.findByIdAndUpdate(
        existingUser._id,
        {
          role: 'superadmin',
          password: hashedPassword,
          company_id: company._id,
          full_name: full_name || existingUser.full_name || username,
          email: email || existingUser.email,
          is_active: true,
        },
        { new: true }
      );
    } else {
      // Create new superadmin user
      superadminUser = await User.create({
        username: username.toLowerCase().trim(),
        password: hashedPassword,
        role: 'superadmin',
        full_name: full_name || username,
        email,
        company_id: company._id,
        is_active: true,
      });
    }

    // Update lock with user details
    await BootstrapLock.updateOne(
      { lock_name: BOOTSTRAP_LOCK_NAME },
      {
        $set: {
          bootstrap_user_id: superadminUser._id,
          bootstrap_username: superadminUser.username,
        },
      }
    );

    // 5. Record in AuditLog
    await AuditLog.create({
      event_type: 'admin_bootstrap',
      performed_by: superadminUser._id,
      performed_by_username: superadminUser.username,
      target_user: superadminUser._id,
      target_username: superadminUser.username,
      company_id: company._id,
      details: {
        message: 'Initial superadmin successfully provisioned via secure bootstrap',
        role: 'superadmin',
      },
      ip_address,
    });

    return {
      success: true,
      message: 'Superadmin provisioned successfully. Bootstrap is now permanently disabled.',
      user: {
        id: superadminUser._id.toString(),
        username: superadminUser.username,
        role: superadminUser.role,
        company_id: company._id.toString(),
      },
    };
  } catch (err) {
    // If user creation failed, we release the lock so admin can retry fixing their input
    await BootstrapLock.updateOne(
      { lock_name: BOOTSTRAP_LOCK_NAME },
      { $set: { is_completed: false } }
    );
    throw err;
  }
}

module.exports = {
  getBootstrapStatus,
  bootstrapSuperAdmin,
};
