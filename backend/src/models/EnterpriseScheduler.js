const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjId = Schema.Types.ObjectId;

const enterpriseSchedulerSchema = new Schema({
  company_id:    { type: ObjId, ref: 'Company', required: true, index: true },
  name:          { type: String, required: true },
  description:   String,
  workflow_id:   { type: ObjId, ref: 'AutomationWorkflow' },
  worker_id:     { type: ObjId, ref: 'DigitalWorker' },
  schedule_type: { type: String, enum: ['once','minutely','hourly','daily','weekly','monthly','cron'], default: 'daily' },
  cron_expression: String,
  run_at:        Date,
  timezone:      { type: String, default: 'Africa/Nairobi' },
  is_active:     { type: Boolean, default: true },
  run_count:     { type: Number, default: 0 },
  last_run_at:   Date,
  next_run_at:   Date,
  last_status:   { type: String, enum: ['success','failed','skipped','running'], default: 'success' },
  params:        Schema.Types.Mixed,
  created_by:    { type: ObjId, ref: 'User' },
}, { timestamps: true });

enterpriseSchedulerSchema.index({ company_id: 1, is_active: 1, next_run_at: 1 });

module.exports = mongoose.model('EnterpriseScheduler', enterpriseSchedulerSchema);
