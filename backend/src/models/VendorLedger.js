const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  vendor_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  vendor_name:  { type: String, required: true },
  vendor_phone: { type: String },
  entry_date:   { type: Date, default: Date.now },
  type:         { type: String, enum: ['bill','payment','credit_note','debit_note','advance','adjustment'], required: true },
  reference_no: { type: String },
  reference_id: { type: mongoose.Schema.Types.ObjectId },
  description:  { type: String },
  debit:        { type: Number, default: 0 },
  credit:       { type: Number, default: 0 },
  balance:      { type: Number, default: 0 },
  financial_year: { type: String },
  branch_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
}, { timestamps: true });
s.index({ company_id: 1, vendor_id: 1, entry_date: -1 });
s.index({ company_id: 1, vendor_name: 1, entry_date: -1 });
s.index({ company_id: 1, entry_date: -1 });
module.exports = mongoose.model('VendorLedger', s);
