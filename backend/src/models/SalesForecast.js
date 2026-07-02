const mongoose = require('mongoose');

const salesForecastSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  period:      { type: String, enum: ['weekly','monthly','quarterly'], default: 'monthly' },
  period_date: { type: Date, required: true },

  // Pipeline-based forecast
  pipeline_value:     { type: Number, default: 0 },
  weighted_value:     { type: Number, default: 0 },
  won_value:          { type: Number, default: 0 },
  lost_value:         { type: Number, default: 0 },
  best_case:          { type: Number, default: 0 },
  worst_case:         { type: Number, default: 0 },

  // AI forecast
  ai_forecast:        { type: Number, default: 0 },
  ai_confidence:      { type: Number, min: 0, max: 100 },
  ai_factors:         [{ type: String }],
  ai_recommendation:  { type: String },

  // Actuals (filled at end of period)
  actual_revenue:     { type: Number },

  target_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesTarget' },
}, { timestamps: true });

salesForecastSchema.index({ company_id: 1, period: 1, period_date: -1 });

module.exports = mongoose.model('SalesForecast', salesForecastSchema);
