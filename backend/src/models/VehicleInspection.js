const mongoose = require('mongoose');

const vehicleInspectionSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fleet_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  driver_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  vehicle_number:   { type: String },

  inspection_type:  {
    type: String,
    enum: ['pre_trip','post_trip','weekly','monthly','annual','breakdown'],
    default: 'pre_trip',
  },

  // Checklist results (pass/fail/na)
  checklist: {
    engine_oil:    { type: String, enum: ['pass','fail','na'], default: 'pass' },
    coolant:       { type: String, enum: ['pass','fail','na'], default: 'pass' },
    brakes:        { type: String, enum: ['pass','fail','na'], default: 'pass' },
    tyres:         { type: String, enum: ['pass','fail','na'], default: 'pass' },
    lights:        { type: String, enum: ['pass','fail','na'], default: 'pass' },
    horn:          { type: String, enum: ['pass','fail','na'], default: 'pass' },
    wipers:        { type: String, enum: ['pass','fail','na'], default: 'pass' },
    fuel_level:    { type: String, enum: ['pass','fail','na'], default: 'pass' },
    documents:     { type: String, enum: ['pass','fail','na'], default: 'pass' },
    body_damage:   { type: String, enum: ['pass','fail','na'], default: 'pass' },
    battery:       { type: String, enum: ['pass','fail','na'], default: 'pass' },
    mirrors:       { type: String, enum: ['pass','fail','na'], default: 'pass' },
  },

  overall_result:   { type: String, enum: ['pass','fail','conditional'], default: 'pass' },
  odometer_reading: { type: Number },
  fuel_level_pct:   { type: Number },
  issues_found:     [{ type: String }],
  photos:           [{ type: String }],
  notes:            { type: String },
  inspected_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  inspected_at:     { type: Date, default: Date.now },
}, { timestamps: true });

vehicleInspectionSchema.index({ company_id: 1, fleet_vehicle_id: 1, inspected_at: -1 });

module.exports = mongoose.model('VehicleInspection', vehicleInspectionSchema);
