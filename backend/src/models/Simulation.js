const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name:          { type: String, required: true },
  description:   { type: String },
  sim_type:      { type: String, enum: ['what_if','traffic','weather','demand','capacity','fleet','warehouse','cost','risk','route','disaster','carbon','custom'], required: true },
  status:        { type: String, enum: ['draft','queued','running','completed','failed','cancelled'], default: 'draft' },
  digital_twin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DigitalTwin' },
  parameters:    { type: mongoose.Schema.Types.Mixed, default: {} },
  variables:     [{ key: String, value: mongoose.Schema.Types.Mixed, unit: String }],
  time_horizon_days: { type: Number, default: 30 },
  iterations:    { type: Number, default: 1 },
  started_at:    { type: Date },
  completed_at:  { type: Date },
  duration_ms:   { type: Number },
  progress_pct:  { type: Number, default: 0 },
  result_summary:{ type: mongoose.Schema.Types.Mixed, default: {} },
  result_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'SimulationResult' },
  triggered_by:  { type: String, enum: ['user','autonomous','schedule','api'], default: 'user' },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

simulationSchema.index({ company_id: 1, status: 1, createdAt: -1 });
module.exports = mongoose.model('Simulation', simulationSchema);
