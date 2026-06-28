const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_name: { type: String, required: true },
  location: String,
  phone: String,
  address: String,
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

branchSchema.index({ company_id: 1, branch_name: 1 }, { unique: true });

// Ensure virtual `id` is included in toJSON / toObject output
branchSchema.set('toJSON',   { virtuals: true });
branchSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Branch', branchSchema);
