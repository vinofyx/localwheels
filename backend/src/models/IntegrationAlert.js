const mongoose = require('mongoose');

const IntegrationAlertSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  connector_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'IntegrationConnector' },
  alert_type:    { type: String, enum: ['connector_down','sync_failed','high_latency','rate_limit','auth_error','webhook_failing','quota_exceeded','custom'], required: true },
  severity:      { type: String, enum: ['critical','high','medium','low'], default: 'medium' },
  title:         { type: String, required: true },
  message:       { type: String },
  status:        { type: String, enum: ['open','acknowledged','resolved'], default: 'open' },
  acknowledged_at:{ type: Date },
  resolved_at:   { type: Date },
  resolved_by:   { type: mongoose.Schema.Types.ObjectId },
  metadata:      { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

IntegrationAlertSchema.index({ company_id: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('IntegrationAlert', IntegrationAlertSchema);
