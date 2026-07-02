const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  period:      { type: String, enum: ['daily','weekly','monthly'], default: 'daily' },
  period_date: { type: Date, required: true },

  uploads_total:     { type: Number, default: 0 },
  uploads_by_type:   { type: mongoose.Schema.Types.Mixed, default: {} },
  ocr_processed:     { type: Number, default: 0 },
  ocr_avg_confidence:{ type: Number, default: 0 },
  ocr_failed:        { type: Number, default: 0 },
  validated_pass:    { type: Number, default: 0 },
  validated_fail:    { type: Number, default: 0 },
  approved:          { type: Number, default: 0 },
  rejected:          { type: Number, default: 0 },
  duplicates_found:  { type: Number, default: 0 },
  auto_linked:       { type: Number, default: 0 },
  avg_processing_ms: { type: Number, default: 0 },
  storage_bytes:     { type: Number, default: 0 },
  expiry_alerts:     { type: Number, default: 0 },
  fraud_detected:    { type: Number, default: 0 },

}, { timestamps: true });

analyticsSchema.index({ company_id: 1, period: 1, period_date: -1 }, { unique: true });
module.exports = mongoose.model('DocumentAnalytics', analyticsSchema);
