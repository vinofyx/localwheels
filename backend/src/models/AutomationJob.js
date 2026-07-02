const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjId = Schema.Types.ObjectId;

const automationJobSchema = new Schema({
  company_id:   { type: ObjId, ref: 'Company', required: true, index: true },
  workflow_id:  { type: ObjId, ref: 'AutomationWorkflow', required: true },
  workflow_name:String,
  job_ref:      { type: String, unique: true },
  status:       { type: String, enum: ['queued','running','completed','failed','cancelled','skipped'], default: 'queued' },
  trigger_type: { type: String, enum: ['schedule','event','manual','webhook','condition','api'] },
  triggered_by: { type: ObjId, ref: 'User' },
  trigger_data: Schema.Types.Mixed,
  steps_total:  { type: Number, default: 0 },
  steps_done:   { type: Number, default: 0 },
  current_step: Number,
  started_at:   Date,
  completed_at: Date,
  duration_ms:  Number,
  error:        String,
  output:       Schema.Types.Mixed,
  retry_count:  { type: Number, default: 0 },
}, { timestamps: true });

automationJobSchema.index({ company_id: 1, status: 1, createdAt: -1 });
automationJobSchema.index({ company_id: 1, workflow_id: 1 });

automationJobSchema.pre('save', async function (next) {
  if (!this.job_ref) {
    const d = new Date();
    const ym = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`;
    const last = await this.constructor.findOne({ job_ref: new RegExp(`^JOB-${ym}-`) })
      .sort({ job_ref: -1 }).select('job_ref').lean();
    const seq = last ? parseInt(last.job_ref.split('-')[2]) + 1 : 1;
    this.job_ref = `JOB-${ym}-${String(seq).padStart(4,'0')}`;
  }
  next();
});

module.exports = mongoose.model('AutomationJob', automationJobSchema);
