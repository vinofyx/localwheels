const mongoose = require('mongoose');

const demandForecastSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  forecast_date:  { type: Date, required: true },
  period_type:    { type: String, enum: ['daily','weekly','monthly','quarterly'], default: 'monthly' },
  region:         { type: String },
  route_id:       { type: mongoose.Schema.Types.ObjectId },
  product_type:   { type: String },
  forecasted_units:   { type: Number, default: 0 },
  forecasted_revenue: { type: Number, default: 0 },
  actual_units:       { type: Number },
  actual_revenue:     { type: Number },
  accuracy_pct:       { type: Number },
  growth_pct:         { type: Number, default: 0 },
  seasonality_factor: { type: Number, default: 1 },
  trend_direction:    { type: String, enum: ['up','down','flat'], default: 'flat' },
  confidence_pct:     { type: Number, default: 0 },
  factors:            [{ name: String, impact: Number, description: String }],
  simulation_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' },
  model_used:     { type: String, default: 'ai_claude' },
}, { timestamps: true });

demandForecastSchema.index({ company_id: 1, forecast_date: -1 });
module.exports = mongoose.model('DemandForecast', demandForecastSchema);
