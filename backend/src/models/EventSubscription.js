const mongoose = require('mongoose');

const EventSubscriptionSchema = new mongoose.Schema({
  company_id:      { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name:            { type: String, required: true },
  event_types:     [{ type: String }],
  subscriber_type: { type: String, enum: ['webhook','automation','internal','email','sms'], default: 'webhook' },
  target_id:       { type: String },
  filter:          { type: mongoose.Schema.Types.Mixed, default: {} },
  is_active:       { type: Boolean, default: true },
  delivery_count:  { type: Number, default: 0 },
  last_delivered_at:{ type: Date },
  created_by:      { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

module.exports = mongoose.model('EventSubscription', EventSubscriptionSchema);
