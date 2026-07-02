const mongoose = require('mongoose');

const vehicleAvailabilitySchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  vehicle_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },

  date:           { type: Date, required: true },
  is_available:   { type: Boolean, default: true },
  unavailable_reason: { type: String },

  current_lat:    { type: Number },
  current_lng:    { type: Number },
  current_load_tons: { type: Number, default: 0 },
  last_location_update: { type: Date },

  trips_today:    { type: Number, default: 0 },
  km_today:       { type: Number, default: 0 },
  fuel_level_pct: { type: Number, default: 100 },
}, { timestamps: true });

vehicleAvailabilitySchema.index({ company_id: 1, vehicle_id: 1, date: 1 }, { unique: true });
vehicleAvailabilitySchema.index({ company_id: 1, date: 1, is_available: 1 });

module.exports = mongoose.model('VehicleAvailability', vehicleAvailabilitySchema);
