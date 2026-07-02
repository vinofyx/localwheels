const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  username: { type: String, required: true, unique: true, lowercase: true },
  // password is optional for Clerk-authenticated users (authProvider === 'clerk')
  password: { type: String },
  full_name: String,
  email: String,
  phone: String,
  // 'operator' kept for backward-compat with legacy data that may exist in the DB.
  // New users can only be created with admin-validated roles (enforced in routes/users.js).
  role: { type: String, enum: ['superadmin', 'admin', 'manager', 'staff', 'operator', 'driver'], default: 'staff' },
  branch_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],
  driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  is_active: { type: Boolean, default: true },

  // Clerk authentication fields
  clerkId:       { type: String, sparse: true, index: true },
  authProvider:  { type: String, enum: ['local', 'clerk'], default: 'local' },
  emailVerified: { type: Boolean, default: false },
  lastLogin:     { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
