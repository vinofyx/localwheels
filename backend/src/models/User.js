const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  username: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  full_name: String,
  email: String,
  phone: String,
  // 'operator' kept for backward-compat with legacy data that may exist in the DB.
  // New users can only be created with admin-validated roles (enforced in routes/users.js).
  role: { type: String, enum: ['superadmin', 'admin', 'manager', 'staff', 'operator'], default: 'staff' },
  branch_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
