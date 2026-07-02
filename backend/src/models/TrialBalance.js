const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  period_date:   { type: Date, required: true },
  financial_year:{ type: String },
  lines:         [{
    account_id:   mongoose.Schema.Types.ObjectId,
    account_code: String,
    account_name: String,
    account_type: String,
    opening_debit: { type: Number, default: 0 },
    opening_credit:{ type: Number, default: 0 },
    period_debit:  { type: Number, default: 0 },
    period_credit: { type: Number, default: 0 },
    closing_debit: { type: Number, default: 0 },
    closing_credit:{ type: Number, default: 0 },
  }],
  total_debit:   { type: Number, default: 0 },
  total_credit:  { type: Number, default: 0 },
  is_balanced:   { type: Boolean, default: false },
  generated_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
s.index({ company_id: 1, period_date: -1 });
module.exports = mongoose.model('TrialBalance', s);
