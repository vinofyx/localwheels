const mongoose = require('mongoose');

const autonomousDecisionSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  title:        { type: String, required: true },
  description:  { type: String },
  decision_type:{ type: String, enum: ['dispatch','route','fleet_allocation','warehouse_allocation','pricing','risk_mitigation','cost_optimization','supplier','custom'], required: true },
  trigger:      { type: String, enum: ['simulation','anomaly','threshold','schedule','ai_recommendation','manual'], default: 'ai_recommendation' },
  trigger_ref:  { type: String },
  status:       { type: String, enum: ['pending_approval','approved','rejected','executing','completed','failed','cancelled'], default: 'pending_approval' },
  priority:     { type: String, enum: ['critical','high','medium','low'], default: 'medium' },
  confidence_pct: { type: Number, default: 0 },
  impact_summary: { type: String },
  estimated_saving: { type: Number, default: 0 },
  risk_level:   { type: String, enum: ['low','medium','high'], default: 'low' },
  requires_human_approval: { type: Boolean, default: true },
  approved_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at:  { type: Date },
  rejected_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejected_at:  { type: Date },
  rejection_reason: { type: String },
  execution_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DecisionExecution' },
  payload:      { type: mongoose.Schema.Types.Mixed, default: {} },
  expires_at:   { type: Date },
  simulation_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' },
}, { timestamps: true });

autonomousDecisionSchema.index({ company_id: 1, status: 1, priority: 1 });
module.exports = mongoose.model('AutonomousDecision', autonomousDecisionSchema);
