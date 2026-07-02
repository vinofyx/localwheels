const mongoose = require('mongoose');

const driverLocationSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  driver_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  trip_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  lat:        { type: Number, required: true },
  lng:        { type: Number, required: true },
  speed_kmh:  { type: Number, default: 0 },
  heading:    { type: Number },
  accuracy_m: { type: Number },
  altitude_m: { type: Number },
  address:    { type: String },
  source:     { type: String, enum: ['gps', 'network', 'manual'], default: 'gps' },
  is_idle:    { type: Boolean, default: false },
  recorded_at:{ type: Date, default: Date.now },
}, { timestamps: true });

driverLocationSchema.index({ company_id: 1, driver_id: 1, recorded_at: -1 });
driverLocationSchema.index({ driver_id: 1, trip_id: 1 });

module.exports = mongoose.model('DriverLocation', driverLocationSchema);
