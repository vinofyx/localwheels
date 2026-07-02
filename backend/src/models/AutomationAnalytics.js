const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjId = Schema.Types.ObjectId;

const automationAnalyticsSchema = new Schema({
  company_id:         { type: ObjId, ref: 'Company', required: true, index: true },
  period:             { type: String, enum: ['daily','weekly','monthly'], default: 'daily' },
  period_date:        { type: Date, required: true },
  workflows_active:   { type: Number, default: 0 },
  jobs_total:         { type: Number, default: 0 },
  jobs_completed:     { type: Number, default: 0 },
  jobs_failed:        { type: Number, default: 0 },
  success_rate_pct:   { type: Number, default: 0 },
  avg_duration_ms:    { type: Number, default: 0 },
  approvals_total:    { type: Number, default: 0 },
  approvals_approved: { type: Number, default: 0 },
  approvals_rejected: { type: Number, default: 0 },
  avg_approval_hours: { type: Number, default: 0 },
  workers_active:     { type: Number, default: 0 },
  tasks_automated:    { type: Number, default: 0 },
  time_saved_hours:   { type: Number, default: 0 },
  cost_saved:         { type: Number, default: 0 },
  top_workflows:      [{ name: String, runs: Number, success_rate: Number }],
}, { timestamps: true });

automationAnalyticsSchema.index({ company_id: 1, period: 1, period_date: -1 });

module.exports = mongoose.model('AutomationAnalytics', automationAnalyticsSchema);
