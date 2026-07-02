const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  account_code:  { type: String, required: true, trim: true, uppercase: true },
  account_name:  { type: String, required: true, trim: true },
  account_type:  { type: String, enum: ['asset','liability','equity','revenue','expense','bank','cash','receivable','payable','tax','other'], required: true },
  parent_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  level:         { type: Number, default: 1 },
  is_leaf:       { type: Boolean, default: true },
  opening_balance: { type: Number, default: 0 },
  current_balance: { type: Number, default: 0 },
  currency:      { type: String, default: 'INR' },
  is_active:     { type: Boolean, default: true },
  description:   { type: String },
  tags:          [String],
}, { timestamps: true });
s.index({ company_id: 1, account_code: 1 }, { unique: true });
s.index({ company_id: 1, account_type: 1 });
s.index({ company_id: 1, parent_id: 1 });
module.exports = mongoose.model('ChartOfAccount', s);
