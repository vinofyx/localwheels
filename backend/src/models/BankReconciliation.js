const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  bank_account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  period_start:    { type: Date, required: true },
  period_end:      { type: Date, required: true },
  statement_balance: { type: Number, default: 0 },
  book_balance:    { type: Number, default: 0 },
  difference:      { type: Number, default: 0 },
  matched_count:   { type: Number, default: 0 },
  unmatched_count: { type: Number, default: 0 },
  status:          { type: String, enum: ['in_progress','completed','approved'], default: 'in_progress' },
  notes:           { type: String },
  completed_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completed_at:    { type: Date },
  created_by:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
s.index({ company_id: 1, bank_account_id: 1, period_end: -1 });
s.index({ company_id: 1, status: 1 });
module.exports = mongoose.model('BankReconciliation', s);
