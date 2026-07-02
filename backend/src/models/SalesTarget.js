const mongoose = require('mongoose');

const salesTargetSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  period:      { type: String, enum: ['monthly','quarterly','annual'], default: 'monthly' },
  period_date: { type: Date, required: true },

  // Targets
  revenue_target:     { type: Number, default: 0 },
  leads_target:       { type: Number, default: 0 },
  conversions_target: { type: Number, default: 0 },
  deals_target:       { type: Number, default: 0 },

  // Actuals (computed)
  revenue_actual:     { type: Number, default: 0 },
  leads_actual:       { type: Number, default: 0 },
  conversions_actual: { type: Number, default: 0 },
  deals_actual:       { type: Number, default: 0 },

  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

salesTargetSchema.index({ company_id: 1, period: 1, period_date: -1 });

module.exports = mongoose.model('SalesTarget', salesTargetSchema);
