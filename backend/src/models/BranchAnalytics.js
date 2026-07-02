const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  branch_name: { type: String },
  period:      { type: String, enum: ['daily','weekly','monthly'], default: 'monthly' },
  period_date: { type: Date, required: true },

  shipments:        { type: Number, default: 0 },
  delivered:        { type: Number, default: 0 },
  delayed:          { type: Number, default: 0 },
  revenue:          { type: Number, default: 0 },
  expenses:         { type: Number, default: 0 },
  profit:           { type: Number, default: 0 },
  on_time_pct:      { type: Number, default: 0 },
  complaints:       { type: Number, default: 0 },
  active_drivers:   { type: Number, default: 0 },
  active_vehicles:  { type: Number, default: 0 },
  customer_count:   { type: Number, default: 0 },
  performance_score: { type: Number, default: 0 },
}, { timestamps: true });

schema.index({ company_id: 1, branch_id: 1, period: 1, period_date: -1 }, { unique: true });
module.exports = mongoose.model('BranchAnalytics', schema);
