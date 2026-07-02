const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  payment_no:    { type: String, required: true, trim: true, uppercase: true },
  payment_date:  { type: Date, default: Date.now },
  vendor_name:   { type: String, required: true },
  vendor_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  amount:        { type: Number, required: true, default: 0 },
  payment_mode:  { type: String, enum: ['cash','cheque','upi','neft','rtgs','card','online','other'], default: 'neft' },
  reference_no:  { type: String },
  bank_name:     { type: String },
  tds_amount:    { type: Number, default: 0 },
  net_amount:    { type: Number, default: 0 },
  status:        { type: String, enum: ['pending','paid','cancelled'], default: 'pending' },
  due_date:      { type: Date },
  paid_date:     { type: Date },
  notes:         { type: String },
  branch_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
s.index({ company_id: 1, payment_no: 1 }, { unique: true });
s.index({ company_id: 1, payment_date: -1 });
s.index({ company_id: 1, vendor_id: 1, status: 1 });
module.exports = mongoose.model('VendorPayment', s);
