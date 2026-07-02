const mongoose = require('mongoose');

const callRecordingSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'VoiceSession', required: true },

  direction:  { type: String, enum: ['incoming', 'outgoing'], default: 'incoming' },
  storage_url: String, // placeholder until call-center telephony integration exists
  duration_sec: { type: Number, default: 0 },

  call_summary:    String,
  call_transcript_ref: { type: mongoose.Schema.Types.ObjectId, ref: 'VoiceSession' },

  transferred_to_human: { type: Boolean, default: false },
  transferred_to_agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

callRecordingSchema.index({ company_id: 1, session_id: 1 });

module.exports = mongoose.model('CallRecording', callRecordingSchema);
