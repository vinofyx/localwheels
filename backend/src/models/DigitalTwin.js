const mongoose = require('mongoose');

const replicaSchema = new mongoose.Schema({
  entity_type: { type: String, enum: ['fleet','warehouse','shipment','driver','customer','supplier','financial','route'], required: true },
  entity_id:   { type: mongoose.Schema.Types.ObjectId },
  entity_ref:  { type: String },
  last_synced: { type: Date },
  state:       { type: mongoose.Schema.Types.Mixed, default: {} },
  health:      { type: Number, default: 100 },
  drift_pct:   { type: Number, default: 0 },
}, { _id: false });

const digitalTwinSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name:         { type: String, required: true },
  description:  { type: String },
  twin_type:    { type: String, enum: ['enterprise','fleet','warehouse','route','supply_chain'], default: 'enterprise' },
  status:       { type: String, enum: ['initializing','active','stale','error','archived'], default: 'initializing' },
  replicas:     [replicaSchema],
  sync_interval_s: { type: Number, default: 300 },
  last_full_sync:  { type: Date },
  health_score:    { type: Number, default: 100 },
  data_freshness_s:{ type: Number, default: 0 },
  total_entities:  { type: Number, default: 0 },
  sync_count:      { type: Number, default: 0 },
  alert_count:     { type: Number, default: 0 },
  created_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags:         [String],
  config:       { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

digitalTwinSchema.index({ company_id: 1, status: 1 });
module.exports = mongoose.model('DigitalTwin', digitalTwinSchema);
