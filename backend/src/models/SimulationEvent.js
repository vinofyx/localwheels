const mongoose = require('mongoose');

const simulationEventSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  simulation_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' },
  event_type:   { type: String, required: true },
  event_time:   { type: Date, default: Date.now },
  sim_time_offset_s: { type: Number, default: 0 },
  entity_type:  { type: String },
  entity_id:    { type: String },
  description:  { type: String },
  impact:       { type: mongoose.Schema.Types.Mixed, default: {} },
  severity:     { type: String, enum: ['info','warning','critical','catastrophic'], default: 'info' },
  probability:  { type: Number, default: 1.0, min: 0, max: 1 },
  triggered:    { type: Boolean, default: true },
  outcome:      { type: String },
}, { timestamps: true });

simulationEventSchema.index({ company_id: 1, simulation_id: 1, event_time: 1 });
module.exports = mongoose.model('SimulationEvent', simulationEventSchema);
