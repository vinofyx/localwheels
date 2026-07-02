const mongoose = require('mongoose');

const vehicleAssignmentSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fleet_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  driver_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  shipment_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  route_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'OptimizedRoute' },

  vehicle_number: { type: String },
  driver_name:    { type: String },
  driver_phone:   { type: String },

  assigned_at:    { type: Date, default: Date.now },
  released_at:    { type: Date },

  assignment_type: {
    type: String,
    enum: ['trip','maintenance','reserved','other'],
    default: 'trip',
  },
  assigned_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  is_ai_assigned: { type: Boolean, default: false },

  odometer_start: { type: Number },
  odometer_end:   { type: Number },
  km_driven:      { type: Number },

  start_location: { type: String },
  end_location:   { type: String },
  trip_revenue:   { type: Number },
  trip_fuel_cost: { type: Number },

  driver_rating:  { type: Number, min: 1, max: 5 },
  notes:          { type: String },
}, { timestamps: true });

vehicleAssignmentSchema.index({ company_id: 1, fleet_vehicle_id: 1, assigned_at: -1 });
vehicleAssignmentSchema.index({ company_id: 1, driver_id: 1 });

module.exports = mongoose.model('VehicleAssignment', vehicleAssignmentSchema);
