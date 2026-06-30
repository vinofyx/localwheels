const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  company_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:           { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  registration_number: { type: String, required: true, uppercase: true, trim: true },
  vehicle_type:        { type: String, enum: ['truck', 'mini_truck', 'tempo', 'trailer', 'container', 'bike'], default: 'truck' },
  load_type:           { type: String, trim: true },
  capacity_tons:       { type: Number, default: 0 },
  make:                { type: String, trim: true },
  model:               { type: String, trim: true },
  year:                { type: Number },
  insurance_expiry:    { type: Date },
  fitness_expiry:      { type: Date },
  permit_expiry:       { type: Date },
  pollution_expiry:    { type: Date },
  status:              { type: String, enum: ['available', 'in_transit', 'maintenance', 'inactive'], default: 'available' },
  current_driver_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  is_active:           { type: Boolean, default: true },
}, { timestamps: true });

vehicleSchema.index({ company_id: 1, registration_number: 1 }, { unique: true });
vehicleSchema.index({ company_id: 1, status: 1 });
vehicleSchema.index({ company_id: 1, branch_id: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
