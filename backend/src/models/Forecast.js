const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  forecast_type: { type: String, enum: ['revenue','shipment','fleet_demand','driver_demand','fuel_cost','maintenance','complaint','document','sales'], required: true },
  period:        { type: String, enum: ['weekly','monthly','quarterly'], default: 'monthly' },
  forecast_date: { type: Date, required: true },

  predicted_value: { type: Number, required: true },
  actual_value:    { type: Number },
  confidence:      { type: Number, default: 0.8 },
  lower_bound:     { type: Number },
  upper_bound:     { type: Number },

  basis:    { type: String },
  trend:    { type: String, enum: ['up','down','stable'] },
  change_pct: { type: Number },

  data_points:  { type: mongoose.Schema.Types.Mixed },
  generated_by: { type: String, default: 'ai' },
}, { timestamps: true });

schema.index({ company_id: 1, forecast_type: 1, forecast_date: -1 });
module.exports = mongoose.model('Forecast', schema);
