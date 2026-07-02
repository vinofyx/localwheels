const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name:          { type: String, required: true },
  description:   String,
  doc_types:     [String],
  color:         { type: String, default: '#6366F1' },
  required_fields: [String],
  is_active:     { type: Boolean, default: true },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('DocumentCategory', categorySchema);
