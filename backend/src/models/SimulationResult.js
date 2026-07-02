const mongoose = require('mongoose');

const simulationResultSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  simulation_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Simulation', required: true },
  scenario_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'SimulationScenario' },
  iteration:    { type: Number, default: 1 },
  outcome:      { type: String, enum: ['positive','negative','neutral','mixed'], default: 'neutral' },
  metrics:      { type: mongoose.Schema.Types.Mixed, default: {} },
  kpis: [{
    name: String, baseline: Number, simulated: Number, unit: String,
    delta: Number, delta_pct: Number, direction: { type: String, enum: ['up','down','neutral'] },
  }],
  timeline:     [{ timestamp: Date, event: String, impact: mongoose.Schema.Types.Mixed }],
  cost_impact:  { type: Number, default: 0 },
  revenue_impact:{ type: Number, default: 0 },
  risk_delta:   { type: Number, default: 0 },
  carbon_delta_kg:{ type: Number, default: 0 },
  summary:      { type: String },
  recommendations:[String],
  confidence_pct: { type: Number, default: 0 },
  data_points:  { type: Number, default: 0 },
  raw_output:   { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

simulationResultSchema.index({ company_id: 1, simulation_id: 1 });
module.exports = mongoose.model('SimulationResult', simulationResultSchema);
