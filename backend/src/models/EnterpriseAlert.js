const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  type:        { type: String, enum: ['shipment_delay','vehicle_breakdown','warehouse_full','supplier_risk','route_closure','weather','security','compliance','financial','system'], default: 'system' },
  severity:    { type: String, enum: ['info','warning','critical','emergency'], default: 'warning' },
  title:       { type: String, required: true },
  message:     String,
  source:      String,
  entity_type: String,
  entity_id:   mongoose.Schema.Types.ObjectId,
  is_read:     { type: Boolean, default: false },
  is_resolved: { type: Boolean, default: false },
  resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolved_at: Date,
  auto_generated: { type: Boolean, default: true },
  metadata:    mongoose.Schema.Types.Mixed,
}, { timestamps: true });
s.index({ company_id: 1, is_resolved: 1, createdAt: -1 });
module.exports = mongoose.model('EnterpriseAlert', s);
