const mongoose = require('mongoose');

const WebhookSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name:          { type: String, required: true },
  url:           { type: String, required: true },
  events:        [{ type: String }],
  secret:        { type: String },
  status:        { type: String, enum: ['active','inactive','failing'], default: 'active' },
  http_method:   { type: String, enum: ['POST','PUT'], default: 'POST' },
  headers:       { type: Map, of: String, default: {} },
  retry_count:   { type: Number, default: 3 },
  retry_delay_s: { type: Number, default: 60 },
  timeout_s:     { type: Number, default: 30 },
  total_deliveries:  { type: Number, default: 0 },
  success_deliveries:{ type: Number, default: 0 },
  failure_deliveries:{ type: Number, default: 0 },
  last_triggered_at: { type: Date },
  last_status_code:  { type: Number },
  created_by:    { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

module.exports = mongoose.model('Webhook', WebhookSchema);
