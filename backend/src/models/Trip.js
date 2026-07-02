const mongoose = require('mongoose');

const tripStopSchema = new mongoose.Schema({
  sequence:        { type: Number, required: true },
  shipment_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  lr_number:       { type: String },
  address:         { type: String },
  lat:             { type: Number },
  lng:             { type: Number },
  stop_type:       { type: String, enum: ['pickup','delivery','hub','return'], default: 'delivery' },
  priority:        { type: String, enum: ['emergency','high','normal','low'], default: 'normal' },
  receiver_name:   { type: String },
  receiver_phone:  { type: String },
  packages:        { type: Number, default: 1 },
  weight_kg:       { type: Number },
  estimated_arrival:{ type: Date },
  actual_arrival:  { type: Date },
  status:          { type: String, enum: ['pending','arrived','completed','skipped'], default: 'pending' },
  pod_collected:   { type: Boolean, default: false },
  notes:           { type: String },
}, { _id: true });

const tripSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  trip_number:  { type: String, unique: true },  // TR-YYYYMMDD-NNNN

  dispatch_plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchPlan' },
  shipment_ids:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' }],
  lr_numbers:    [{ type: String }],

  // Assignment
  vehicle_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle' },
  driver_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  vehicle_number:{ type: String },
  driver_name:   { type: String },
  driver_phone:  { type: String },

  // Stops
  stops:         [tripStopSchema],
  origin_address:{ type: String },

  // Trip type
  trip_type: {
    type: String,
    enum: ['single','multi_stop','round_trip','return_trip','hub_transfer','cross_dock'],
    default: 'single',
  },

  // Status flow: planned → approved → loading → in_progress → completed / cancelled
  status: {
    type: String,
    enum: ['planned','approved','loading','in_progress','completed','cancelled','exception','replanning'],
    default: 'planned',
  },

  // Load
  total_weight_kg:  { type: Number, default: 0 },
  total_packages:   { type: Number, default: 0 },
  load_utilization_pct: { type: Number, default: 0 },

  // Timing
  planned_start:  { type: Date },
  actual_start:   { type: Date },
  planned_end:    { type: Date },
  actual_end:     { type: Date },
  estimated_duration_min: { type: Number },

  // Distance & cost
  total_distance_km: { type: Number },
  fuel_cost:         { type: Number },
  toll_cost:         { type: Number },
  trip_cost:         { type: Number },
  fuel_consumed_l:   { type: Number },

  // Odometer
  odometer_start: { type: Number },
  odometer_end:   { type: Number },

  // Issues
  has_exception: { type: Boolean, default: false },
  exception_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DispatchException' }],

  // Manifest
  manifest_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchManifest' },

  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at: { type: Date },

  // Digital driver acknowledgement (Phase 6 enhancement)
  driver_acknowledged:               { type: Boolean, default: false },
  driver_acknowledged_at:              { type: Date },
  driver_acknowledgement_signature:      { type: String },

  // Automatic replanning (Phase 6 enhancement)
  replan_reason:    { type: String },
  replanned_at:       { type: Date },
  replanned_by:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

tripSchema.index({ company_id: 1, status: 1 });
tripSchema.index({ company_id: 1, vehicle_id: 1 });
tripSchema.index({ company_id: 1, driver_id: 1 });
tripSchema.index({ company_id: 1, trip_number: 1 });
tripSchema.index({ company_id: 1, planned_start: -1 });

module.exports = mongoose.model('Trip', tripSchema);
