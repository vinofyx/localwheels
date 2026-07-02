const mongoose = require('mongoose');

const routeHistorySchema = new mongoose.Schema({
  company_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  optimized_route_id: { type: mongoose.Schema.Types.ObjectId, ref: 'OptimizedRoute' },
  vehicle_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  driver_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  vehicle_number:     { type: String },
  driver_name:        { type: String },

  shipment_ids:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' }],
  lr_numbers:         [{ type: String }],

  origin_address:        { type: String },
  destination_summary:   { type: String },
  total_stops:           { type: Number, default: 1 },

  total_distance_km:      { type: Number },
  actual_duration_min:    { type: Number },
  estimated_duration_min: { type: Number },

  fuel_consumed_liters:  { type: Number },
  fuel_cost_actual:      { type: Number },
  fuel_cost_estimated:   { type: Number },
  fuel_saving:           { type: Number },
  co2_emission_kg:       { type: Number },

  optimization_score:    { type: Number },
  optimization_type:     { type: String },
  on_time:               { type: Boolean },
  delay_minutes:         { type: Number, default: 0 },

  started_at:    { type: Date },
  completed_at:  { type: Date },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

routeHistorySchema.index({ company_id: 1, createdAt: -1 });
routeHistorySchema.index({ company_id: 1, vehicle_id: 1 });
routeHistorySchema.index({ company_id: 1, driver_id: 1 });

module.exports = mongoose.model('RouteHistory', routeHistorySchema);
