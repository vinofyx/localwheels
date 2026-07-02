const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name:          { type: String, required: true },
  code:          { type: String, uppercase: true },
  description:   { type: String },
  account_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount' },
  is_active:     { type: Boolean, default: true },
  monthly_budget:{ type: Number, default: 0 },
}, { timestamps: true });
s.index({ company_id: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('ExpenseCategory', s);
