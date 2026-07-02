const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  tax_type:      { type: String, enum: ['gst','igst','cgst','sgst','tds','tcs','other'], required: true },
  transaction_date: { type: Date, default: Date.now },
  reference_type:{ type: String, enum: ['invoice','payment','expense','journal'], required: true },
  reference_id:  { type: mongoose.Schema.Types.ObjectId, required: true },
  reference_no:  { type: String },
  party_name:    { type: String },
  party_gstin:   { type: String, uppercase: true },
  taxable_amount:{ type: Number, default: 0 },
  tax_rate:      { type: Number, default: 0 },
  tax_amount:    { type: Number, default: 0 },
  hsn_code:      { type: String },
  place_of_supply:{ type: String },
  is_interstate: { type: Boolean, default: false },
  financial_year:{ type: String },
  return_period: { type: String },
  status:        { type: String, enum: ['pending','filed','paid','adjusted'], default: 'pending' },
}, { timestamps: true });
s.index({ company_id: 1, tax_type: 1, transaction_date: -1 });
s.index({ company_id: 1, return_period: 1 });
s.index({ reference_id: 1 });
module.exports = mongoose.model('TaxTransaction', s);
