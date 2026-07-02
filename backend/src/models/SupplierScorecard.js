const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  supplier_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  period:           { type: String, enum: ['monthly','quarterly','annual'], default: 'monthly' },
  period_date:      { type: Date, required: true },
  on_time_delivery: { type: Number, default: 0 },
  quality_score:    { type: Number, default: 0 },
  price_competitiveness: { type: Number, default: 0 },
  responsiveness:   { type: Number, default: 0 },
  sla_compliance:   { type: Number, default: 0 },
  defect_rate:      { type: Number, default: 0 },
  overall_score:    { type: Number, default: 0 },
  grade:            { type: String, enum: ['A','B','C','D','F'], default: 'C' },
  orders_count:     { type: Number, default: 0 },
  total_spend:      { type: Number, default: 0 },
  late_deliveries:  { type: Number, default: 0 },
  rejected_items:   { type: Number, default: 0 },
  ai_summary:       String,
  recommendations:  [String],
}, { timestamps: true });
s.index({ company_id: 1, supplier_id: 1, period: 1, period_date: -1 });
s.index({ company_id: 1, overall_score: -1 });
module.exports = mongoose.model('SupplierScorecard', s);
