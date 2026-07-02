const mongoose = require('mongoose');

const voiceTranscriptSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'VoiceSession', required: true },

  turn_index: { type: Number, required: true },
  speaker:    { type: String, enum: ['user', 'assistant'], required: true },

  text_encrypted: { type: String, required: true }, // AES-256 encrypted transcript text
  language:        { type: String, enum: ['en', 'hi', 'te', 'ta', 'kn'], default: 'en' },

  intent:        String,
  confidence:    { type: Number, default: 0 },
  sentiment:     { type: String, enum: ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'], default: 'neutral' },
}, { timestamps: true });

voiceTranscriptSchema.index({ company_id: 1, session_id: 1, turn_index: 1 });

module.exports = mongoose.model('VoiceTranscript', voiceTranscriptSchema);
