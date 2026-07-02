const mongoose = require('mongoose');

const dispatchPlanSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },

  plan_number: { type: String, unique: true }, // DP-YYYYMMDD-NNNN

  // Shipments in this plan
  shipment_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' }],
  lr_numbers:   [{ type: String }],
  queue_ids:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'DispatchQueue' }],

  // AI-recommended assignment
  recommended_vehicle_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle' },
  recommended_driver_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  recommended_vehicle_num: { type: String },
  recommended_driver_name: { type: String },

  // Confirmed assignment (may differ if dispatcher overrides)
  vehicle_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle' },
  driver_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  vehicle_number:{ type: String },
  driver_name:  { type: String },

  // Load summary
  total_weight_kg:  { type: Number, default: 0 },
  total_packages:   { type: Number, default: 0 },
  total_stops:      { type: Number, default: 0 },
  load_type:        { type: String, enum: ['ftl','ltl','partial','cross_dock'], default: 'ftl' },
  utilization_pct:  { type: Number, default: 0 },

  // Route
  route_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'OptimizedRoute' },
  origin_address:   { type: String },
  total_distance_km:{ type: Number },
  estimated_duration_min: { type: Number },

  // Timing
  planned_dispatch_time: { type: Date },
  estimated_arrival:     { type: Date },

  // AI output
  ai_confidence:    { type: Number, min: 0, max: 100 },
  ai_reasoning:     { type: String },
  ai_risks:         [{ type: String }],
  ai_grouping_reason:{ type: String },
  optimization_score: { type: Number },

  // Fuel & cost
  fuel_cost_estimate:  { type: Number },
  trip_cost_estimate:  { type: Number },

  status: {
    type: String,
    enum: ['draft','approved','in_progress','completed','cancelled'],
    default: 'draft',
  },
  is_manual_override: { type: Boolean, default: false },
  override_reason:    { type: String },
  override_by:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  trip_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_by:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at:{ type: Date },
}, { timestamps: true });

dispatchPlanSchema.index({ company_id: 1, status: 1 });
dispatchPlanSchema.index({ company_id: 1, createdAt: -1 });
// plan_number has unique:true in field def — no extra index needed

module.exports = mongoose.model('DispatchPlan', dispatchPlanSchema);
