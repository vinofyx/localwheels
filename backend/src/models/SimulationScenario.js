const mongoose = require('mongoose');

const scenarioSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name:        { type: String, required: true },
  description: { type: String },
  category:    { type: String, enum: ['demand','supply','risk','cost','capacity','route','weather','fleet','carbon','custom'], required: true },
  template:    { type: String },
  parameters:  { type: mongoose.Schema.Types.Mixed, default: {} },
  assumptions: [{ label: String, value: mongoose.Schema.Types.Mixed }],
  kpis:        [{ metric: String, baseline: Number, simulated: Number, delta_pct: Number }],
  status:      { type: String, enum: ['draft','ready','running','completed','archived'], default: 'draft' },
  simulation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' },
  result_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'SimulationResult' },
  ai_generated:{ type: Boolean, default: false },
  confidence_pct: { type: Number, default: 0 },
  recommended: { type: Boolean, default: false },
  run_count:   { type: Number, default: 0 },
  last_run_at: { type: Date },
  tags:        [String],
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

scenarioSchema.index({ company_id: 1, category: 1, status: 1 });
module.exports = mongoose.model('SimulationScenario', scenarioSchema);
