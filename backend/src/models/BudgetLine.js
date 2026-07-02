const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  budget_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true },
  account_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  account_name:  { type: String },
  category:      { type: String },
  period:        { type: String },
  budget_amount: { type: Number, default: 0 },
  actual_amount: { type: Number, default: 0 },
  variance:      { type: Number, default: 0 },
  variance_pct:  { type: Number, default: 0 },
  notes:         { type: String },
}, { timestamps: true });
s.index({ company_id: 1, budget_id: 1 });
s.index({ company_id: 1, account_id: 1 });
module.exports = mongoose.model('BudgetLine', s);
