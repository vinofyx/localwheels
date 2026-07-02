const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  document_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  version:       { type: Number, required: true },
  file_path:     String,
  file_url:      String,
  size_bytes:    Number,
  mime_type:     String,
  ocr_text:      String,
  extracted_fields: { type: mongoose.Schema.Types.Mixed },
  change_notes:  String,
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checksum:      String,
}, { timestamps: true });

versionSchema.index({ document_id: 1, version: -1 });
module.exports = mongoose.model('DocumentVersion', versionSchema);
