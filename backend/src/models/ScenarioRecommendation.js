const mongoose = require('mongoose');

const scenarioRecommendationSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  scenario_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'SimulationScenario' },
  simulation_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' },
  title:        { type: String, required: true },
  description:  { type: String },
  category:     { type: String, enum: ['cost','revenue','risk','efficiency','carbon','capacity','route','fleet','warehouse','demand','supply'] },
  priority:     { type: String, enum: ['critical','high','medium','low'], default: 'medium' },
  impact:       { type: String },
  estimated_saving: { type: Number, default: 0 },
  estimated_saving_currency: { type: String, default: 'INR' },
  confidence_pct: { type: Number, default: 0 },
  effort:       { type: String, enum: ['low','medium','high'], default: 'medium' },
  timeframe:    { type: String, enum: ['immediate','week','month','quarter'], default: 'month' },
  actions:      [String],
  status:       { type: String, enum: ['pending','accepted','rejected','implemented'], default: 'pending' },
  accepted_at:  { type: Date },
  implemented_at: { type: Date },
  accepted_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ai_generated: { type: Boolean, default: true },
  source_data:  { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

scenarioRecommendationSchema.index({ company_id: 1, priority: 1, status: 1 });
module.exports = mongoose.model('ScenarioRecommendation', scenarioRecommendationSchema);
