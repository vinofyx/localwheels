const mongoose = require('mongoose');

const decisionExecutionSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  decision_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'AutonomousDecision', required: true },
  status:       { type: String, enum: ['queued','running','completed','failed','rolled_back'], default: 'queued' },
  steps: [{
    step_no:    Number,
    action:     String,
    status:     { type: String, enum: ['pending','running','completed','failed','skipped'], default: 'pending' },
    result:     mongoose.Schema.Types.Mixed,
    started_at: Date,
    ended_at:   Date,
    duration_ms:Number,
    error:      String,
  }],
  started_at:   { type: Date },
  completed_at: { type: Date },
  duration_ms:  { type: Number },
  actual_saving:{ type: Number, default: 0 },
  outcome:      { type: String },
  rolled_back:  { type: Boolean, default: false },
  rollback_at:  { type: Date },
  rollback_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  executed_by:  { type: String, default: 'autonomous_engine' },
  audit_trail:  [{ ts: Date, action: String, actor: String, detail: String }],
}, { timestamps: true });

module.exports = mongoose.model('DecisionExecution', decisionExecutionSchema);
