const mongoose = require('mongoose');

const validationSchema = new mongoose.Schema({
  document_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

  checks: [{
    name:    String,
    passed:  Boolean,
    message: String,
    field:   String,
  }],

  validation_errors:   [{ field: String, message: String }],
  warnings: [{ field: String, message: String }],

  score:      { type: Number, default: 0 },
  is_valid:   { type: Boolean, default: false },

  is_duplicate:     { type: Boolean, default: false },
  duplicate_doc_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  fraud_risk:       { type: String, enum: ['low','medium','high'], default: 'low' },

  validated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validated_at: Date,

}, { timestamps: true, suppressReservedKeysWarning: true });

validationSchema.index({ document_id: 1 });
module.exports = mongoose.model('DocumentValidation', validationSchema);
