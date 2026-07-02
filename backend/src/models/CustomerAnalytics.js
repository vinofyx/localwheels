const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  period:      { type: String, enum: ['daily','weekly','monthly'], default: 'monthly' },
  period_date: { type: Date, required: true },

  total_customers:    { type: Number, default: 0 },
  active_customers:   { type: Number, default: 0 },
  new_customers:      { type: Number, default: 0 },
  churned_customers:  { type: Number, default: 0 },
  retention_rate:     { type: Number, default: 0 },
  avg_revenue_per_customer: { type: Number, default: 0 },
  top_customers:      [{ customer_id: mongoose.Schema.Types.ObjectId, name: String, revenue: Number }],
  satisfaction_score: { type: Number, default: 0 },
  nps_score:          { type: Number, default: 0 },
  complaints_per_customer: { type: Number, default: 0 },
  repeat_booking_rate: { type: Number, default: 0 },
}, { timestamps: true });

schema.index({ company_id: 1, period: 1, period_date: -1 }, { unique: true });
module.exports = mongoose.model('CustomerAnalytics', schema);
