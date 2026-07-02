const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  expense_no:    { type: String, required: true, trim: true, uppercase: true },
  expense_date:  { type: Date, default: Date.now },
  category:      { type: String, required: true },
  sub_category:  { type: String },
  description:   { type: String, required: true },
  amount:        { type: Number, required: true, default: 0 },
  tax_amount:    { type: Number, default: 0 },
  total_amount:  { type: Number, default: 0 },
  payment_mode:  { type: String, enum: ['cash','card','upi','neft','cheque','reimbursement','other'], default: 'cash' },
  vendor_name:   { type: String },
  vendor_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  reference_no:  { type: String },
  receipt_url:   { type: String },
  status:        { type: String, enum: ['draft','submitted','approved','rejected','paid'], default: 'draft' },
  cost_center_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'CostCenter' },
  branch_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  approved_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at:   { type: Date },
  paid_date:     { type: Date },
  journal_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
s.index({ company_id: 1, expense_no: 1 }, { unique: true });
s.index({ company_id: 1, expense_date: -1 });
s.index({ company_id: 1, status: 1 });
s.index({ company_id: 1, category: 1 });
module.exports = mongoose.model('Expense', s);
