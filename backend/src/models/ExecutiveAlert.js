const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  alert_type:  { type: String, enum: ['revenue_drop','delayed_shipments','fleet_downtime','driver_shortage','maintenance_due','document_expiry','complaint_sla_breach','sales_target_miss','fraud_risk','anomaly'], required: true },
  severity:    { type: String, enum: ['info','warning','critical'], default: 'warning' },
  title:       { type: String, required: true },
  message:     { type: String, required: true },
  metric_name: { type: String },
  metric_value: { type: Number },
  threshold:   { type: Number },
  source_module: { type: String },
  source_id:   { type: mongoose.Schema.Types.ObjectId },
  is_read:     { type: Boolean, default: false, index: true },
  is_resolved: { type: Boolean, default: false },
  resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolved_at: { type: Date },
  action_url:  { type: String },
}, { timestamps: true });

schema.index({ company_id: 1, is_resolved: 1, createdAt: -1 });
module.exports = mongoose.model('ExecutiveAlert', schema);
