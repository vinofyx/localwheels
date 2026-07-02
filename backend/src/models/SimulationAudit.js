const mongoose = require('mongoose');

const simulationAuditSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  entity_type:  { type: String, enum: ['simulation','scenario','decision','twin','recommendation','recovery_plan'], required: true },
  entity_id:    { type: mongoose.Schema.Types.ObjectId, required: true },
  action:       { type: String, required: true },
  actor_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actor_name:   { type: String },
  actor_type:   { type: String, enum: ['user','system','autonomous','ai'], default: 'user' },
  changes:      { type: mongoose.Schema.Types.Mixed },
  before:       { type: mongoose.Schema.Types.Mixed },
  after:        { type: mongoose.Schema.Types.Mixed },
  ip_address:   { type: String },
  user_agent:   { type: String },
  result:       { type: String, enum: ['success','failure','partial'], default: 'success' },
  notes:        { type: String },
}, {
  timestamps: false,
  toJSON: { virtuals: false },
});

simulationAuditSchema.add({ logged_at: { type: Date, default: Date.now } });
simulationAuditSchema.index({ company_id: 1, entity_type: 1, logged_at: -1 });
module.exports = mongoose.model('SimulationAudit', simulationAuditSchema);
