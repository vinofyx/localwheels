const mongoose = require('mongoose');

const capacityForecastSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  forecast_date: { type: Date, required: true },
  horizon_days:  { type: Number, default: 30 },
  entity_type:   { type: String, enum: ['fleet','warehouse','driver','route','overall'], default: 'overall' },
  entity_id:     { type: mongoose.Schema.Types.ObjectId },
  current_capacity:  { type: Number, default: 0 },
  forecasted_demand: { type: Number, default: 0 },
  utilization_pct:   { type: Number, default: 0 },
  shortage_units:    { type: Number, default: 0 },
  surplus_units:     { type: Number, default: 0 },
  peak_date:         { type: Date },
  peak_demand:       { type: Number, default: 0 },
  recommendations:   [String],
  confidence_pct:    { type: Number, default: 0 },
  data_points:       [{ date: Date, demand: Number, capacity: Number, utilization: Number }],
  simulation_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' },
  generated_by:      { type: String, enum: ['ai','manual','schedule'], default: 'ai' },
}, { timestamps: true });

capacityForecastSchema.index({ company_id: 1, forecast_date: -1 });
module.exports = mongoose.model('CapacityForecast', capacityForecastSchema);
