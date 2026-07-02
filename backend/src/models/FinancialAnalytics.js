const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  period:      { type: String, enum: ['daily','weekly','monthly','quarterly','yearly'], default: 'monthly' },
  period_date: { type: Date, required: true },

  revenue_gross:   { type: Number, default: 0 },
  revenue_net:     { type: Number, default: 0 },
  expenses_total:  { type: Number, default: 0 },
  expenses_fuel:   { type: Number, default: 0 },
  expenses_driver: { type: Number, default: 0 },
  expenses_maintenance: { type: Number, default: 0 },
  expenses_toll:   { type: Number, default: 0 },
  expenses_other:  { type: Number, default: 0 },
  profit:          { type: Number, default: 0 },
  profit_margin:   { type: Number, default: 0 },

  revenue_by_type:   { type: mongoose.Schema.Types.Mixed, default: {} },
  revenue_by_branch: { type: mongoose.Schema.Types.Mixed, default: {} },
  revenue_by_customer: { type: mongoose.Schema.Types.Mixed, default: {} },

  outstanding_receivables: { type: Number, default: 0 },
  outstanding_payables:    { type: Number, default: 0 },
  collections_today:       { type: Number, default: 0 },
}, { timestamps: true });

schema.index({ company_id: 1, period: 1, period_date: -1 }, { unique: true });
module.exports = mongoose.model('FinancialAnalytics', schema);
