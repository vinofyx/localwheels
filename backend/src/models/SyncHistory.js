const mongoose = require('mongoose');

const SyncHistorySchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  connector_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'IntegrationConnector' },
  sync_ref:       { type: String },
  entity_type:    { type: String },
  direction:      { type: String, enum: ['inbound','outbound','bidirectional'] },
  status:         { type: String, enum: ['success','partial','failed'], default: 'success' },
  records_total:  { type: Number, default: 0 },
  records_synced: { type: Number, default: 0 },
  records_failed: { type: Number, default: 0 },
  conflicts:      { type: Number, default: 0 },
  duration_ms:    { type: Number },
  started_at:     { type: Date },
  completed_at:   { type: Date },
  error:          { type: String },
  notes:          { type: String },
}, { timestamps: true });

SyncHistorySchema.index({ company_id: 1, createdAt: -1 });

module.exports = mongoose.model('SyncHistory', SyncHistorySchema);
