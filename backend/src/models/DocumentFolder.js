const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  branch_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  parent_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentFolder', default: null },
  name:        { type: String, required: true },
  description: String,
  color:       { type: String, default: '#3B82F6' },
  icon:        { type: String, default: 'folder' },
  is_system:   { type: Boolean, default: false },
  doc_count:   { type: Number, default: 0 },
  path:        { type: String },
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

folderSchema.index({ company_id: 1, parent_id: 1 });
module.exports = mongoose.model('DocumentFolder', folderSchema);
