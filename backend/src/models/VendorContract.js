const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  vendor_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  contract_ref:  { type: String, required: true },
  title:         { type: String, required: true },
  type:          { type: String, enum: ['service','supply','maintenance','lease','partnership','other'], default: 'service' },
  status:        { type: String, enum: ['draft','active','expiring_soon','expired','terminated'], default: 'draft' },
  start_date:    { type: Date, required: true },
  end_date:      { type: Date, required: true },
  value:         { type: Number, default: 0 },
  currency:      { type: String, default: 'KES' },
  payment_terms: String,
  sla_terms:     String,
  penalty_clause: String,
  auto_renew:    { type: Boolean, default: false },
  renewal_notice_days: { type: Number, default: 30 },
  document_url:  String,
  signed_by:     String,
  signed_date:   Date,
  notes:         String,
}, { timestamps: true });
s.index({ company_id: 1, contract_ref: 1 }, { unique: true });
module.exports = mongoose.model('VendorContract', s);
