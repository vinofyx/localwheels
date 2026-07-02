const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  receipt_no:    { type: String, required: true, trim: true, uppercase: true },
  receipt_date:  { type: Date, default: Date.now },
  customer_name: { type: String, required: true },
  customer_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  amount:        { type: Number, required: true, default: 0 },
  payment_mode:  { type: String, enum: ['cash','cheque','upi','neft','rtgs','card','online','other'], default: 'cash' },
  reference_no:  { type: String },
  bank_name:     { type: String },
  invoice_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  invoice_number:{ type: String },
  notes:         { type: String },
  status:        { type: String, enum: ['pending','cleared','bounced','cancelled'], default: 'cleared' },
  branch_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
s.index({ company_id: 1, receipt_no: 1 }, { unique: true });
s.index({ company_id: 1, receipt_date: -1 });
s.index({ company_id: 1, customer_id: 1 });
module.exports = mongoose.model('Receipt', s);
