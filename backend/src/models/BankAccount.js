const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  account_name:  { type: String, required: true },
  account_number:{ type: String, required: true },
  bank_name:     { type: String, required: true },
  branch_name:   { type: String },
  ifsc_code:     { type: String, uppercase: true },
  account_type:  { type: String, enum: ['savings','current','cc','od','cash'], default: 'current' },
  currency:      { type: String, default: 'INR' },
  opening_balance: { type: Number, default: 0 },
  current_balance: { type: Number, default: 0 },
  last_reconciled_at: { type: Date },
  is_active:     { type: Boolean, default: true },
  chart_account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
}, { timestamps: true });
s.index({ company_id: 1, account_number: 1 }, { unique: true });
s.index({ company_id: 1, is_active: 1 });
module.exports = mongoose.model('BankAccount', s);
