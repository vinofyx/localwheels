const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  incident_ref: { type: String, required: true },
  type:         { type: String, enum: ['accident','breakdown','theft','delay','weather','compliance','customer_complaint','supplier_failure','system_outage','other'], default: 'other' },
  severity:     { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  status:       { type: String, enum: ['open','investigating','escalated','resolved','closed'], default: 'open' },
  title:        { type: String, required: true },
  description:  String,
  location:     String,
  entity_type:  String,
  entity_id:    mongoose.Schema.Types.ObjectId,
  entity_ref:   String,
  reported_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assigned_to:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  escalated_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolved_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolved_at:  Date,
  resolution:   String,
  impact:       String,
  root_cause:   String,
  actions_taken:[String],
  estimated_cost: { type: Number, default: 0 },
  attachments:  [{ name: String, url: String }],
}, { timestamps: true });
s.index({ company_id: 1, status: 1, createdAt: -1 });
module.exports = mongoose.model('Incident', s);
