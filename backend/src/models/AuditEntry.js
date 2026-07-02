const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  entity_type:   { type: String, required: true },
  entity_id:     { type: mongoose.Schema.Types.ObjectId },
  reference_no:  { type: String },
  action:        { type: String, enum: ['create','update','delete','post','reverse','approve','reject','lock','unlock'], required: true },
  description:   { type: String },
  old_value:     { type: mongoose.Schema.Types.Mixed },
  new_value:     { type: mongoose.Schema.Types.Mixed },
  performed_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performed_at:  { type: Date, default: Date.now },
  ip_address:    { type: String },
  financial_year:{ type: String },
}, { timestamps: true });
s.index({ company_id: 1, entity_type: 1, performed_at: -1 });
s.index({ company_id: 1, entity_id: 1 });
s.index({ performed_at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 * 7 }); // 7 year TTL
module.exports = mongoose.model('AuditEntry', s);
