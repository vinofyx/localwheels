const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  return_type:   { type: String, enum: ['GSTR1','GSTR3B','GSTR2A','GSTR2B','GSTR9','GSTR9C'], required: true },
  return_period: { type: String, required: true },
  financial_year:{ type: String, required: true },
  gstin:         { type: String, required: true, uppercase: true },
  outward_supply:{ type: Number, default: 0 },
  inward_supply: { type: Number, default: 0 },
  igst_liability:{ type: Number, default: 0 },
  cgst_liability:{ type: Number, default: 0 },
  sgst_liability:{ type: Number, default: 0 },
  total_tax:     { type: Number, default: 0 },
  itc_claimed:   { type: Number, default: 0 },
  net_payable:   { type: Number, default: 0 },
  status:        { type: String, enum: ['draft','computed','filed','accepted'], default: 'draft' },
  filed_at:      { type: Date },
  filing_reference: { type: String },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
s.index({ company_id: 1, return_type: 1, return_period: 1 }, { unique: true });
s.index({ company_id: 1, status: 1 });
module.exports = mongoose.model('GSTReturn', s);
