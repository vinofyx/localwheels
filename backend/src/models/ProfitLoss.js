const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  period:        { type: String, enum: ['monthly','quarterly','annual'], required: true },
  period_date:   { type: Date, required: true },
  financial_year:{ type: String },
  revenue: {
    logistics_income:  { type: Number, default: 0 },
    freight_income:    { type: Number, default: 0 },
    other_income:      { type: Number, default: 0 },
    total:             { type: Number, default: 0 },
  },
  expenses: {
    vehicle_fuel:    { type: Number, default: 0 },
    vehicle_maint:   { type: Number, default: 0 },
    driver_salary:   { type: Number, default: 0 },
    rent_office:     { type: Number, default: 0 },
    utilities:       { type: Number, default: 0 },
    staff_salary:    { type: Number, default: 0 },
    insurance:       { type: Number, default: 0 },
    other_expense:   { type: Number, default: 0 },
    total:           { type: Number, default: 0 },
  },
  gross_profit:  { type: Number, default: 0 },
  gross_margin_pct: { type: Number, default: 0 },
  net_profit:    { type: Number, default: 0 },
  net_margin_pct:{ type: Number, default: 0 },
  branch_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
}, { timestamps: true });
s.index({ company_id: 1, period: 1, period_date: -1 }, { unique: true });
module.exports = mongoose.model('ProfitLoss', s);
