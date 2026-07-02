const mongoose = require('mongoose');

const driverDocumentSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  driver_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },

  doc_type: {
    type: String,
    enum: ['driving_license', 'vehicle_rc', 'insurance', 'permit', 'fitness', 'puc', 'medical', 'police_verification', 'other'],
    required: true,
  },
  doc_number:  { type: String },
  title:       { type: String, required: true },
  issued_date: { type: Date },
  expiry_date: { type: Date },
  issued_by:   { type: String },

  file_url:    { type: String },
  thumbnail:   { type: String },
  status:      { type: String, enum: ['valid', 'expiring_soon', 'expired', 'pending_renewal'], default: 'valid' },
  notes:       { type: String },

  alert_sent:  { type: Boolean, default: false },
  verified:    { type: Boolean, default: false },
  verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verified_at: { type: Date },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

driverDocumentSchema.index({ company_id: 1, driver_id: 1 });
driverDocumentSchema.index({ expiry_date: 1, status: 1 });

module.exports = mongoose.model('DriverDocument', driverDocumentSchema);
