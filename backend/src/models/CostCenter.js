const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  code:          { type: String, required: true, uppercase: true },
  name:          { type: String, required: true },
  type:          { type: String, enum: ['branch','department','project','product','region','other'], default: 'department' },
  parent_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'CostCenter' },
  manager_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  budget_amount: { type: Number, default: 0 },
  actual_amount: { type: Number, default: 0 },
  is_active:     { type: Boolean, default: true },
  description:   { type: String },
  branch_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
}, { timestamps: true });
s.index({ company_id: 1, code: 1 }, { unique: true });
s.index({ company_id: 1, type: 1 });
module.exports = mongoose.model('CostCenter', s);
