const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name:       { type: String, required: true },
  color:      { type: String, default: '#6366F1' },
  doc_count:  { type: Number, default: 0 },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

tagSchema.index({ company_id: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('DocumentTag', tagSchema);
