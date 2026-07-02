const mongoose = require('mongoose');

const vehicleDocumentSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fleet_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  vehicle_number:   { type: String },

  doc_type: {
    type: String,
    enum: ['rc','insurance','permit','fitness','puc','road_tax','fastag','purchase_invoice',
           'lease_agreement','vehicle_image','other'],
    required: true,
  },
  doc_name:    { type: String },
  doc_number:  { type: String },
  issue_date:  { type: Date },
  expiry_date: { type: Date },
  file_url:    { type: String },
  file_name:   { type: String },

  is_verified: { type: Boolean, default: false },
  notes:       { type: String },
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

vehicleDocumentSchema.index({ company_id: 1, fleet_vehicle_id: 1, doc_type: 1 });
vehicleDocumentSchema.index({ company_id: 1, expiry_date: 1 });

module.exports = mongoose.model('VehicleDocument', vehicleDocumentSchema);
