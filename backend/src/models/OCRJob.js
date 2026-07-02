const mongoose = require('mongoose');

const ocrJobSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  document_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  document_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],

  type:   { type: String, enum: ['single','bulk'], default: 'single' },
  status: { type: String, enum: ['queued','processing','done','failed','cancelled'], default: 'queued', index: true },

  priority:    { type: Number, default: 5 },
  attempts:    { type: Number, default: 0 },
  max_attempts:{ type: Number, default: 3 },

  started_at:   Date,
  completed_at: Date,
  failed_at:    Date,
  error:        String,

  result_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'OCRResult' },
  processing_time_ms: Number,

  requested_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

ocrJobSchema.index({ status: 1, priority: -1, createdAt: 1 });
module.exports = mongoose.model('OCRJob', ocrJobSchema);
