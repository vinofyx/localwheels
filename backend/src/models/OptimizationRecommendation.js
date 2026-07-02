const mongoose = require('mongoose');

const optimizationRecommendationSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  title:        { type: String, required: true },
  description:  { type: String },
  domain:       { type: String, enum: ['fleet','route','warehouse','dispatch','supply_chain','cost','carbon','demand','capacity','risk'], required: true },
  type:         { type: String, enum: ['immediate','strategic','preventive','corrective'], default: 'strategic' },
  priority:     { type: String, enum: ['critical','high','medium','low'], default: 'medium' },
  status:       { type: String, enum: ['new','reviewing','accepted','rejected','implementing','done'], default: 'new' },
  source:       { type: String, enum: ['simulation','digital_twin','ai_analysis','anomaly','manual'], default: 'simulation' },
  simulation_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' },
  estimated_impact: {
    cost_saving_inr: Number, time_saving_hrs: Number,
    carbon_saving_kg: Number, efficiency_gain_pct: Number,
  },
  actions:      [String],
  kpis:         [{ metric: String, current: Number, target: Number, unit: String }],
  confidence_pct: { type: Number, default: 0 },
  effort:       { type: String, enum: ['low','medium','high'], default: 'medium' },
  timeframe_days: { type: Number, default: 30 },
  reviewed_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewed_at:  { type: Date },
}, { timestamps: true });

optimizationRecommendationSchema.index({ company_id: 1, priority: 1, status: 1 });
module.exports = mongoose.model('OptimizationRecommendation', optimizationRecommendationSchema);
