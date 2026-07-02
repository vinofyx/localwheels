const mongoose = require('mongoose');

const IntegrationJobSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  connector_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'IntegrationConnector' },
  job_ref:        { type: String, unique: true },
  job_type:       { type: String, enum: ['sync','import','export','transform','validate','test'], default: 'sync' },
  entity_type:    { type: String },
  direction:      { type: String, enum: ['inbound','outbound'], default: 'outbound' },
  status:         { type: String, enum: ['queued','running','completed','failed','cancelled'], default: 'queued' },
  records_total:  { type: Number, default: 0 },
  records_synced: { type: Number, default: 0 },
  records_failed: { type: Number, default: 0 },
  records_skipped:{ type: Number, default: 0 },
  started_at:     { type: Date },
  completed_at:   { type: Date },
  duration_ms:    { type: Number },
  error:          { type: String },
  log_summary:    [{ type: String }],
  triggered_by:   { type: String, default: 'manual' },
}, { timestamps: true });

IntegrationJobSchema.pre('save', async function(next) {
  if (!this.job_ref) {
    const now = new Date();
    const period = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}`;
    const count = await mongoose.model('IntegrationJob').countDocuments({ company_id: this.company_id }) + 1;
    this.job_ref = `INTJOB-${period}-${String(count).padStart(4,'0')}`;
  }
  next();
});

module.exports = mongoose.model('IntegrationJob', IntegrationJobSchema);
