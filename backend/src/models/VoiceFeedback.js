const mongoose = require('mongoose');

const voiceFeedbackSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'VoiceSession', required: true },

  rating:  { type: Number, min: 1, max: 5, required: true },
  comment: String,
  customer_phone: String,
}, { timestamps: true });

voiceFeedbackSchema.index({ company_id: 1, session_id: 1 });

module.exports = mongoose.model('VoiceFeedback', voiceFeedbackSchema);
