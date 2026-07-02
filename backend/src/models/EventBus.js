const mongoose = require('mongoose');

const EventBusSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  event_id:     { type: String, unique: true },
  event_type:   { type: String, required: true },
  source:       { type: String, required: true },
  payload:      { type: mongoose.Schema.Types.Mixed },
  status:       { type: String, enum: ['published','processing','delivered','failed','dead_letter'], default: 'published' },
  subscribers:  [{ subscriber_id: String, status: String, delivered_at: Date }],
  retry_count:  { type: Number, default: 0 },
  max_retries:  { type: Number, default: 3 },
  published_at: { type: Date, default: Date.now },
  processed_at: { type: Date },
  ttl_seconds:  { type: Number, default: 86400 },
  tags:         [{ type: String }],
}, { timestamps: true });

EventBusSchema.pre('save', function(next) {
  if (!this.event_id) {
    this.event_id = `EVT-${Date.now()}-${Math.random().toString(36).substr(2,6).toUpperCase()}`;
  }
  next();
});

EventBusSchema.index({ company_id: 1, published_at: -1 });
EventBusSchema.index({ event_type: 1, status: 1 });

module.exports = mongoose.model('EventBus', EventBusSchema);
