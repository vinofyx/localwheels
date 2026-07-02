const mongoose = require('mongoose');

const vehicleFuelSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fleet_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  driver_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  vehicle_number:   { type: String },
  driver_name:      { type: String },

  filling_date:     { type: Date, default: Date.now },
  fuel_type:        { type: String, enum: ['diesel','petrol','cng','electric'], default: 'diesel' },
  liters_filled:    { type: Number, required: true },
  price_per_liter:  { type: Number },
  total_cost:       { type: Number },
  odometer_before:  { type: Number },
  odometer_after:   { type: Number },
  distance_since_last: { type: Number },
  mileage_kmpl:     { type: Number },

  filling_station:  { type: String },
  station_lat:      { type: Number },
  station_lng:      { type: Number },

  // Theft detection
  is_suspicious:    { type: Boolean, default: false },
  suspicious_reason:{ type: String },

  notes:      { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

vehicleFuelSchema.index({ company_id: 1, fleet_vehicle_id: 1, filling_date: -1 });
vehicleFuelSchema.index({ company_id: 1, is_suspicious: 1 });

module.exports = mongoose.model('VehicleFuel', vehicleFuelSchema);
