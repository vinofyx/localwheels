const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjId = Schema.Types.ObjectId;

const WORKER_TYPES = [
  'data_entry','report_generator','invoice_processor','lead_qualifier',
  'shipment_tracker','maintenance_scheduler','inventory_monitor',
  'complaint_router','document_classifier','alert_monitor','custom',
];

const digitalWorkerSchema = new Schema({
  company_id:     { type: ObjId, ref: 'Company', required: true, index: true },
  name:           { type: String, required: true },
  worker_type:    { type: String, enum: WORKER_TYPES, default: 'custom' },
  description:    String,
  avatar_icon:    { type: String, default: '🤖' },
  is_active:      { type: Boolean, default: true },
  capabilities:   [String],
  assigned_workflows: [{ type: ObjId, ref: 'AutomationWorkflow' }],
  schedule_cron:  String,
  last_active_at: Date,
  tasks_completed:{ type: Number, default: 0 },
  tasks_failed:   { type: Number, default: 0 },
  uptime_pct:     { type: Number, default: 100 },
  current_status: { type: String, enum: ['idle','running','paused','error','offline'], default: 'idle' },
  config:         Schema.Types.Mixed,
  created_by:     { type: ObjId, ref: 'User' },
}, { timestamps: true });

digitalWorkerSchema.index({ company_id: 1, is_active: 1 });

module.exports = mongoose.model('DigitalWorker', digitalWorkerSchema);
