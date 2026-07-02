const mongoose = require('mongoose');

const voiceIntentSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'VoiceSession', required: true },

  intent:     { type: String, required: true }, // e.g. track_shipment, get_quote, raise_complaint, dispatch_summary
  category:   { type: String, enum: ['customer', 'dispatcher', 'fleet', 'management', 'driver', 'general'], default: 'customer' },
  entities:   { type: mongoose.Schema.Types.Mixed, default: {} }, // extracted slots: lr_number, pincode, vehicle_id, etc.
  confidence: { type: Number, default: 0 },

  resolved_action: String,   // which module/function handled it
  success:         { type: Boolean, default: false },
  error_reason:    String,
}, { timestamps: true });

voiceIntentSchema.index({ company_id: 1, intent: 1, createdAt: -1 });

module.exports = mongoose.model('VoiceIntent', voiceIntentSchema);
