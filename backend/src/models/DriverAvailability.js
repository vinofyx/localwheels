const mongoose = require('mongoose');

const driverAvailabilitySchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  driver_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },

  date:           { type: Date, required: true },
  shift_start:    { type: String }, // "08:00"
  shift_end:      { type: String }, // "20:00"
  hours_driven:   { type: Number, default: 0 },
  max_hours:      { type: Number, default: 10 },
  is_available:   { type: Boolean, default: true },
  unavailable_reason: { type: String },

  current_lat:    { type: Number },
  current_lng:    { type: Number },
  last_location_update: { type: Date },

  trips_today:    { type: Number, default: 0 },
  rating:         { type: Number, min: 0, max: 5 },
}, { timestamps: true });

driverAvailabilitySchema.index({ company_id: 1, driver_id: 1, date: 1 }, { unique: true });
driverAvailabilitySchema.index({ company_id: 1, date: 1, is_available: 1 });

module.exports = mongoose.model('DriverAvailability', driverAvailabilitySchema);
