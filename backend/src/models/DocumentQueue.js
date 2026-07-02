const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  document_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  job_type:    { type: String, enum: ['ocr','validate','auto_link','thumbnail','reprocess'], default: 'ocr' },
  status:      { type: String, enum: ['waiting','processing','done','failed'], default: 'waiting', index: true },
  priority:    { type: Number, default: 5 },
  payload:     { type: mongoose.Schema.Types.Mixed },
  error:       String,
  attempts:    { type: Number, default: 0 },
  process_after: { type: Date, default: Date.now },
  started_at:  Date,
  done_at:     Date,
}, { timestamps: true });

queueSchema.index({ status: 1, priority: -1, process_after: 1 });
module.exports = mongoose.model('DocumentQueue', queueSchema);
