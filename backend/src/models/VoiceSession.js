const mongoose = require('mongoose');

const voiceSessionSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  session_number: { type: String, unique: true },

  channel: {
    type: String,
    enum: ['website', 'customer_portal', 'dispatcher_dashboard', 'driver_portal', 'mobile_browser', 'call_center'],
    default: 'website',
  },

  user_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user_role:      { type: String, enum: ['customer', 'dispatcher', 'driver', 'manager', 'agent', 'anonymous'], default: 'customer' },
  customer_phone: String,
  customer_name:  String,

  language: { type: String, enum: ['en', 'hi', 'te', 'ta', 'kn'], default: 'en' },

  status: { type: String, enum: ['active', 'ended', 'transferred'], default: 'active' },

  started_at: { type: Date, default: Date.now },
  ended_at:   Date,
  duration_sec: { type: Number, default: 0 },

  turn_count:   { type: Number, default: 0 },
  resolution:   { type: String, enum: ['resolved', 'unresolved', 'transferred_to_human', 'abandoned'], default: 'unresolved' },
  transferred_to_human: { type: Boolean, default: false },

  context: { type: mongoose.Schema.Types.Mixed, default: {} }, // running conversation memory (entities, last intent, etc.)
}, { timestamps: true });

voiceSessionSchema.index({ company_id: 1, createdAt: -1 });
voiceSessionSchema.index({ company_id: 1, status: 1 });
voiceSessionSchema.index({ customer_phone: 1 });

module.exports = mongoose.model('VoiceSession', voiceSessionSchema);
