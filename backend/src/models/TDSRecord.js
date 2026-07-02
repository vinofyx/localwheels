const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  tds_type:      { type: String, enum: ['tds','tcs'], default: 'tds' },
  section:       { type: String, required: true },
  deductee_name: { type: String, required: true },
  deductee_pan:  { type: String, uppercase: true },
  payment_date:  { type: Date, default: Date.now },
  payment_amount:{ type: Number, default: 0 },
  tds_rate:      { type: Number, default: 0 },
  tds_amount:    { type: Number, default: 0 },
  surcharge:     { type: Number, default: 0 },
  cess:          { type: Number, default: 0 },
  total_tds:     { type: Number, default: 0 },
  return_quarter:{ type: String },
  financial_year:{ type: String },
  challan_no:    { type: String },
  status:        { type: String, enum: ['deducted','deposited','returned'], default: 'deducted' },
  reference_id:  { type: mongoose.Schema.Types.ObjectId },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
s.index({ company_id: 1, return_quarter: 1, financial_year: 1 });
s.index({ company_id: 1, deductee_pan: 1 });
module.exports = mongoose.model('TDSRecord', s);
