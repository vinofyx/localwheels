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

module.exports = mongoose.model('Branch', branchSchema);
