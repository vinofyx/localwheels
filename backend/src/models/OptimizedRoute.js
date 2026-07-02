const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  sequence:       { type: Number, required: true },
  shipment_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  lr_number:      { type: String },
  address:        { type: String },
  lat:            { type: Number },
  lng:            { type: Number },
  stop_type:      { type: String, enum: ['pickup', 'delivery', 'hub'], default: 'delivery' },
  priority:       { type: String, enum: ['emergency', 'high', 'normal', 'low'], default: 'normal' },
  time_window_start: { type: Date },
  time_window_end:   { type: Date },
  estimated_arrival: { type: Date },
  actual_arrival:    { type: Date },
  status:         { type: String, enum: ['pending', 'completed', 'skipped'], default: 'pending' },
}, { _id: false });

const optimizedRouteSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },

  // Assignment
  vehicle_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  driver_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  vehicle_number: { type: String },
  driver_name:    { type: String },

  // Route
  origin_address: { type: String },
  origin_lat:     { type: Number },
  origin_lng:     { type: Number },
  stops:          [stopSchema],

  // Optimization inputs
  optimization_type: {
    type: String,
    enum: ['shortest_distance', 'lowest_fuel', 'lowest_toll', 'fastest', 'balanced', 'ai_recommended'],
    default: 'ai_recommended',
  },
  route_type: {
    type: String,
    enum: ['single_stop', 'multi_stop', 'pickup_delivery', 'round_trip', 'return_trip', 'express', 'economy'],
    default: 'single_stop',
  },

  // Metrics
  total_distance_km:      { type: Number, default: 0 },
  estimated_duration_min: { type: Number, default: 0 },
  optimization_score:     { type: Number, min: 0, max: 100, default: 0 },
  fuel_cost_estimated:    { type: Number, default: 0 },
  fuel_cost_optimized:    { type: Number, default: 0 },
  fuel_saving:            { type: Number, default: 0 },
  co2_emission_kg:        { type: Number, default: 0 },
  toll_cost_estimated:    { type: Number, default: 0 },

  // AI output
  ai_recommendation:  { type: String },
  ai_reasoning:       { type: String },
  ai_risks:           [{ type: String }],
  ai_alternatives:    [{ type: mongoose.Schema.Types.Mixed }],
  delay_risk:         { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  delay_risk_reason:  { type: String },

  // Conditions at time of optimization
  weather_summary:   { type: String },
  traffic_summary:   { type: String },
  weather_alerts:    [{ type: String }],
  traffic_alerts:    [{ type: String }],

  // Status
  status: {
    type: String,
    enum: ['pending', 'assigned', 'active', 'completed', 'cancelled', 'recalculating'],
    default: 'pending',
  },
  is_manual_override: { type: Boolean, default: false },
  override_reason:    { type: String },
  override_by:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Tracking
  started_at:   { type: Date },
  completed_at: { type: Date },
  created_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

optimizedRouteSchema.index({ company_id: 1, status: 1 });
optimizedRouteSchema.index({ company_id: 1, vehicle_id: 1 });
optimizedRouteSchema.index({ company_id: 1, driver_id: 1 });
optimizedRouteSchema.index({ company_id: 1, createdAt: -1 });

module.exports = mongoose.model('OptimizedRoute', optimizedRouteSchema);
