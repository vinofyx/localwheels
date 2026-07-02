const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  payment_no:    { type: String, required: true, trim: true, uppercase: true },
  payment_date:  { type: Date, default: Date.now },
  customer_name: { type: String, required: true },
  customer_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  amount:        { type: Number, required: true, default: 0 },
  payment_mode:  { type: String, enum: ['cash','cheque','upi','neft','rtgs','card','online','advance','other'], default: 'upi' },
  reference_no:  { type: String },
  bank_name:     { type: String },
  allocated_invoices: [{ invoice_id: mongoose.Schema.Types.ObjectId, invoice_number: String, allocated_amount: Number }],
  allocated_amount: { type: Number, default: 0 },
  unallocated_amount: { type: Number, default: 0 },
  status:        { type: String, enum: ['pending','allocated','partial','cancelled'], default: 'pending' },
  is_advance:    { type: Boolean, default: false },
  notes:         { type: String },
  branch_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
s.index({ company_id: 1, payment_no: 1 }, { unique: true });
s.index({ company_id: 1, payment_date: -1 });
s.index({ company_id: 1, customer_id: 1, status: 1 });
module.exports = mongoose.model('CustomerPayment', s);
