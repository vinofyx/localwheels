const mongoose = require('mongoose');

const simulationJobSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  simulation_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Simulation', required: true },
  job_type:     { type: String, enum: ['run','batch','schedule','export'], default: 'run' },
  status:       { type: String, enum: ['queued','running','completed','failed','cancelled'], default: 'queued' },
  priority:     { type: Number, default: 5, min: 1, max: 10 },
  queued_at:    { type: Date, default: Date.now },
  started_at:   { type: Date },
  completed_at: { type: Date },
  duration_ms:  { type: Number },
  progress_pct: { type: Number, default: 0 },
  logs:         [{ ts: Date, level: String, message: String }],
  error_message:{ type: String },
  worker_id:    { type: String },
  result_ref:   { type: String },
  triggered_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

simulationJobSchema.index({ company_id: 1, status: 1, queued_at: 1 });
module.exports = mongoose.model('SimulationJob', simulationJobSchema);
