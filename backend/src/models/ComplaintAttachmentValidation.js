const mongoose = require('mongoose');

const complaintAttachmentValidationSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  complaint_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  attachment_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'ComplaintAttachment' },
  original_name:  String,
  safe_name:       String,
  mime_type:       String,
  file_size_kb:    Number,
  category:         { type: String, enum: ['image','video','document','audio', null], default: null },
  content_hash:     String,
  is_duplicate:     { type: Boolean, default: false },
  duplicate_of:      { type: mongoose.Schema.Types.ObjectId, ref: 'ComplaintAttachment' },
  valid:             { type: Boolean, required: true },
  errors:            [String],
  virus_scan_status: { type: String, enum: ['not_scanned','clean','infected','error'], default: 'not_scanned' },
  uploaded_by_type:  { type: String, enum: ['customer','agent'], default: 'agent' },
}, { timestamps: true, suppressReservedKeysWarning: true });

complaintAttachmentValidationSchema.index({ company_id: 1, complaint_id: 1 });
complaintAttachmentValidationSchema.index({ company_id: 1, content_hash: 1 });

module.exports = mongoose.model('ComplaintAttachmentValidation', complaintAttachmentValidationSchema);
