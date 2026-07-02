const mongoose = require('mongoose');

// Extends the existing Vehicle master with full fleet management data
const fleetVehicleSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  vehicle_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' }, // link to existing Vehicle master

  // Identity
  vehicle_number:      { type: String, required: true, trim: true, uppercase: true },
  registration_number: { type: String, required: true, trim: true, uppercase: true },
  vehicle_type:   { type: String, enum: ['truck','mini_truck','tempo','trailer','container','bike','bus','tanker','tipper'], default: 'truck' },
  vehicle_category: { type: String, trim: true }, // e.g. LCV, HCV, MCV

  // Manufacturer info
  manufacturer:  { type: String, trim: true },
  model:         { type: String, trim: true },
  year:          { type: Number },
  color:         { type: String, trim: true },
  engine_number: { type: String, trim: true, uppercase: true },
  chassis_number:{ type: String, trim: true, uppercase: true },

  // Fuel & capacity
  fuel_type:     { type: String, enum: ['diesel','petrol','cng','electric','hybrid'], default: 'diesel' },
  capacity_tons: { type: Number, default: 0 },
  capacity_cbm:  { type: Number, default: 0 }, // cubic metres
  length_ft:     { type: Number },
  width_ft:      { type: Number },
  height_ft:     { type: Number },

  // Ownership
  ownership_type:{ type: String, enum: ['owned','leased','hired','contracted'], default: 'owned' },
  purchase_date: { type: Date },
  purchase_cost: { type: Number, default: 0 },
  lease_end_date:{ type: Date },

  // Assignment
  current_driver_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  current_driver_name:{ type: String },
  current_branch_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  current_branch_name:{ type: String },

  // Location (from last GPS ping)
  current_lat:   { type: Number },
  current_lng:   { type: Number },
  current_address:{ type: String },
  last_gps_update:{ type: Date },
  current_speed_kmh: { type: Number, default: 0 },

  // Status — extended beyond basic Vehicle model
  status: {
    type: String,
    enum: ['available','assigned','on_trip','loading','unloading','maintenance','breakdown',
           'accident','idle','reserved','out_of_service','inactive'],
    default: 'available',
  },
  status_reason: { type: String },
  status_since:  { type: Date, default: Date.now },

  // Metrics
  odometer_km:   { type: Number, default: 0 },
  engine_hours:  { type: Number, default: 0 },
  fuel_level_pct:{ type: Number, default: 100, min: 0, max: 100 },
  fuel_tank_liters: { type: Number, default: 100 },

  // Health
  health_score:  { type: Number, default: 100, min: 0, max: 100 },
  health_grade:  { type: String, enum: ['A','B','C','D','F'], default: 'A' },
  last_health_update: { type: Date },

  // Compliance dates
  insurance_expiry:   { type: Date },
  fitness_expiry:     { type: Date },
  permit_expiry:      { type: Date },
  pollution_expiry:   { type: Date },
  road_tax_expiry:    { type: Date },
  fastag_valid:       { type: Boolean, default: true },

  // Stats (running totals)
  total_trips:        { type: Number, default: 0 },
  total_km:           { type: Number, default: 0 },
  total_fuel_liters:  { type: Number, default: 0 },
  total_revenue:      { type: Number, default: 0 },
  total_expenses:     { type: Number, default: 0 },
  breakdown_count:    { type: Number, default: 0 },

  // Notes & AI
  notes:          { type: String },
  ai_flags:       [{ type: String }],
  is_active:      { type: Boolean, default: true },
}, { timestamps: true });

fleetVehicleSchema.index({ company_id: 1, vehicle_number: 1 }, { unique: true });
fleetVehicleSchema.index({ company_id: 1, status: 1 });
fleetVehicleSchema.index({ company_id: 1, branch_id: 1 });
fleetVehicleSchema.index({ company_id: 1, current_driver_id: 1 });

module.exports = mongoose.model('FleetVehicle', fleetVehicleSchema);
