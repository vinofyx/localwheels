const mongoose = require('mongoose');

const SyncConflictSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  connector_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'IntegrationConnector' },
  entity_type:   { type: String },
  entity_id:     { type: String },
  local_value:   { type: mongoose.Schema.Types.Mixed },
  remote_value:  { type: mongoose.Schema.Types.Mixed },
  resolution:    { type: String, enum: ['pending','local_wins','remote_wins','manual','ignored'], default: 'pending' },
  resolved_at:   { type: Date },
  resolved_by:   { type: mongoose.Schema.Types.ObjectId },
  notes:         { type: String },
}, { timestamps: true });

module.exports = mongoose.model('SyncConflict', SyncConflictSchema);
