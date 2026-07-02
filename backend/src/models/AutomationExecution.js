const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjId = Schema.Types.ObjectId;

const automationExecutionSchema = new Schema({
  company_id:  { type: ObjId, ref: 'Company', required: true, index: true },
  job_id:      { type: ObjId, ref: 'AutomationJob', required: true },
  workflow_id: { type: ObjId, ref: 'AutomationWorkflow' },
  step_number: Number,
  step_name:   String,
  action_type: String,
  status:      { type: String, enum: ['running','completed','failed','skipped'], default: 'running' },
  input:       Schema.Types.Mixed,
  output:      Schema.Types.Mixed,
  error:       String,
  duration_ms: Number,
  started_at:  Date,
  ended_at:    Date,
  logs:        [{ level: String, message: String, ts: Date }],
}, { timestamps: true });

automationExecutionSchema.index({ company_id: 1, job_id: 1 });
automationExecutionSchema.index({ company_id: 1, workflow_id: 1, createdAt: -1 });

module.exports = mongoose.model('AutomationExecution', automationExecutionSchema);
