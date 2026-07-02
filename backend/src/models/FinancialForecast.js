const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  forecast_name: { type: String, required: true },
  forecast_type: { type: String, enum: ['revenue','expense','cashflow','profit'], required: true },
  period:        { type: String, enum: ['monthly','quarterly','annual'], default: 'monthly' },
  start_date:    { type: Date, required: true },
  end_date:      { type: Date, required: true },
  data_points:   [{ period_label: String, forecast_amount: Number, actual_amount: Number, variance: Number }],
  total_forecast:{ type: Number, default: 0 },
  total_actual:  { type: Number, default: 0 },
  accuracy_pct:  { type: Number, default: 0 },
  ai_generated:  { type: Boolean, default: false },
  ai_insights:   [String],
  status:        { type: String, enum: ['draft','active','completed'], default: 'draft' },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
s.index({ company_id: 1, forecast_type: 1, start_date: -1 });
module.exports = mongoose.model('FinancialForecast', s);
