const mongoose = require('mongoose');

const recoveryPlanSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  bcp_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessContinuity' },
  risk_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'OperationalRisk' },
  title:       { type: String, required: true },
  incident_type: { type: String, required: true },
  severity:    { type: String, enum: ['critical','high','medium','low'], default: 'high' },
  status:      { type: String, enum: ['standby','activated','executing','completed','closed'], default: 'standby' },
  activation_trigger: { type: String },
  activated_at:{ type: Date },
  completed_at:{ type: Date },
  rto_target_hours: { type: Number, default: 24 },
  actual_recovery_hours: { type: Number },
  affected_operations: [String],
  resources_deployed: [{ resource_type: String, quantity: Number, cost: Number }],
  checkpoints: [{
    title: String, status: String, completed_at: Date, notes: String,
  }],
  lessons_learned: { type: String },
  total_cost:  { type: Number, default: 0 },
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
recoveryPlanSchema.index({ company_id: 1, status: 1 });
recoveryPlanSchema.index({ company_id: 1, severity: 1, status: 1 });

module.exports = mongoose.model('RecoveryPlan', recoveryPlanSchema);
