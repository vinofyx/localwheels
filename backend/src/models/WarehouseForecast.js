const mongoose = require('mongoose');

const warehouseForecastSchema = new mongoose.Schema({
  company_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  warehouse_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  forecast_type: {
    type: String,
    enum: ['stock_out','replenishment','utilization','inbound_volume','outbound_volume','labour_demand','dock_demand'],
    required: true,
  },
  period_date:       { type: Date, required: true },
  horizon_days:      { type: Number, default: 30 },

  // For SKU-level forecasts
  sku:               { type: String, trim: true, uppercase: true },
  product_name:      { type: String, trim: true },

  // Predictions
  current_qty:       { type: Number, default: 0 },
  predicted_qty:     { type: Number, default: 0 },
  predicted_demand:  { type: Number, default: 0 },
  reorder_point:     { type: Number, default: 0 },
  suggested_order_qty: { type: Number, default: 0 },
  predicted_utilization_pct: { type: Number },
  predicted_stockout_date:   { type: Date },
  days_until_stockout:       { type: Number },

  confidence_score:  { type: Number, default: 0.7, min: 0, max: 1 },
  risk_level:        { type: String, enum: ['low','medium','high','critical'], default: 'low' },
  recommended_action:{ type: String, trim: true },
  ai_explanation:    { type: String, trim: true },

  // Historical basis
  avg_daily_consumption: { type: Number, default: 0 },
  historical_days:       { type: Number, default: 30 },
  trend:                 { type: String, enum: ['increasing','decreasing','stable','volatile'], default: 'stable' },

  is_actioned:       { type: Boolean, default: false },
  actioned_at:       { type: Date },
  generated_at:      { type: Date, default: Date.now },
}, { timestamps: true });

warehouseForecastSchema.index({ company_id: 1, warehouse_id: 1, forecast_type: 1 });
warehouseForecastSchema.index({ warehouse_id: 1, sku: 1, period_date: -1 });
warehouseForecastSchema.index({ warehouse_id: 1, risk_level: 1, is_actioned: 1 });

module.exports = mongoose.model('WarehouseForecast', warehouseForecastSchema);
