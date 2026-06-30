const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  company_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  name:               { type: String, required: true, trim: true },
  phone:              { type: String, required: true, trim: true },
  alternate_phone:    { type: String, trim: true },
  license_number:     { type: String, required: true, trim: true, uppercase: true },
  license_expiry:     { type: Date },
  address:            { type: String, trim: true },
  city:               { type: String, trim: true },
  emergency_contact:  { type: String, trim: true },
  date_of_joining:    { type: Date },
  status:             { type: String, enum: ['available', 'on_trip', 'leave', 'inactive'], default: 'available' },
  current_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  is_active:          { type: Boolean, default: true },
}, { timestamps: true });

driverSchema.index({ company_id: 1, phone: 1 });
driverSchema.index({ company_id: 1, status: 1 });
driverSchema.index({ company_id: 1, license_number: 1 });

module.exports = mongoose.model('Driver', driverSchema);
