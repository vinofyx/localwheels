const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  period:        { type: String, enum: ['daily','weekly','monthly'], default: 'monthly' },
  period_date:   { type: Date, required: true },
  opening_balance: { type: Number, default: 0 },
  closing_balance: { type: Number, default: 0 },
  inflows: {
    customer_receipts: { type: Number, default: 0 },
    advance_receipts:  { type: Number, default: 0 },
    other_income:      { type: Number, default: 0 },
    total:             { type: Number, default: 0 },
  },
  outflows: {
    vendor_payments:   { type: Number, default: 0 },
    expense_payments:  { type: Number, default: 0 },
    salary_payments:   { type: Number, default: 0 },
    tax_payments:      { type: Number, default: 0 },
    other_payments:    { type: Number, default: 0 },
    total:             { type: Number, default: 0 },
  },
  net_flow:      { type: Number, default: 0 },
  branch_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
}, { timestamps: true });
s.index({ company_id: 1, period: 1, period_date: -1 }, { unique: true });
s.index({ company_id: 1, period_date: -1 });
module.exports = mongoose.model('CashFlow', s);
