const mongoose = require('mongoose');

const WebhookDeliverySchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  webhook_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Webhook', required: true },
  event_type:   { type: String, required: true },
  event_id:     { type: String },
  payload:      { type: mongoose.Schema.Types.Mixed },
  status:       { type: String, enum: ['pending','delivered','failed','retrying'], default: 'pending' },
  attempt:      { type: Number, default: 1 },
  max_attempts: { type: Number, default: 3 },
  response_code:{ type: Number },
  response_body:{ type: String },
  duration_ms:  { type: Number },
  next_retry_at:{ type: Date },
  delivered_at: { type: Date },
  error:        { type: String },
}, { timestamps: true });

module.exports = mongoose.model('WebhookDelivery', WebhookDeliverySchema);
