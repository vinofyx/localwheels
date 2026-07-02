const mongoose = require('mongoose');

const complaintAttachmentSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  complaint_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  uploaded_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploader_name:{ type: String },
  uploader_role:{ type: String, enum: ['customer','agent','supervisor'] },

  file_name:    { type: String, required: true },
  file_type:    { type: String }, // MIME type
  file_size_kb: { type: Number },
  file_url:     { type: String, required: true },
  category:     { type: String, enum: ['photo','document','video','audio','other'], default: 'document' },
  description:  { type: String },
  is_verified:  { type: Boolean, default: false },
}, { timestamps: true });

complaintAttachmentSchema.index({ company_id: 1, complaint_id: 1 });

module.exports = mongoose.model('ComplaintAttachment', complaintAttachmentSchema);
