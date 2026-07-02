const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  insight_type: { type: String, enum: ['revenue','shipment','fleet','driver','complaint','sales','document','operations','customer'], required: true },
  title:       { type: String, required: true },
  summary:     { type: String, required: true },
  detail:      { type: String },
  severity:    { type: String, enum: ['info','warning','critical','opportunity'], default: 'info' },
  data_points: { type: mongoose.Schema.Types.Mixed },
  recommendation: { type: String },
  source_modules: [String],
  generated_by: { type: String, default: 'ai' },
  is_read:     { type: Boolean, default: false },
  valid_until: { type: Date },
}, { timestamps: true });

schema.index({ company_id: 1, createdAt: -1 });
module.exports = mongoose.model('BusinessInsight', schema);
