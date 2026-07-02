const mongoose = require('mongoose');

const voiceAnalyticsSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  period:      { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
  period_date: { type: Date, required: true },

  total_sessions:      { type: Number, default: 0 },
  total_turns:          { type: Number, default: 0 },
  avg_call_duration_sec: { type: Number, default: 0 },
  ai_resolution_count:    { type: Number, default: 0 },
  human_transfer_count:    { type: Number, default: 0 },
  ai_resolution_rate_pct:   { type: Number, default: 0 },
  human_transfer_rate_pct:   { type: Number, default: 0 },

  top_intents:          [{ intent: String, count: Number }],
  language_distribution: { type: mongoose.Schema.Types.Mixed, default: {} }, // { en: 12, hi: 5, ... }
  avg_satisfaction_score:  { type: Number, default: 0 },
}, { timestamps: true });

voiceAnalyticsSchema.index({ company_id: 1, period: 1, period_date: -1 }, { unique: true });

module.exports = mongoose.model('VoiceAnalytics', voiceAnalyticsSchema);
