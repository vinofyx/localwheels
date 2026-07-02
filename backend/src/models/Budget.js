const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  budget_name:   { type: String, required: true },
  financial_year:{ type: String, required: true },
  period_type:   { type: String, enum: ['annual','quarterly','monthly'], default: 'annual' },
  status:        { type: String, enum: ['draft','approved','active','closed'], default: 'draft' },
  total_revenue_budget: { type: Number, default: 0 },
  total_expense_budget: { type: Number, default: 0 },
  notes:         { type: String },
  approved_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at:   { type: Date },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  branch_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
}, { timestamps: true });
s.index({ company_id: 1, financial_year: 1, status: 1 });
module.exports = mongoose.model('Budget', s);
