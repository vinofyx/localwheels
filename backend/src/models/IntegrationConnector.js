const mongoose = require('mongoose');

const IntegrationConnectorSchema = new mongoose.Schema({
  company_id:      { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name:            { type: String, required: true },
  connector_type:  { type: String, enum: ['erp','crm','accounting','payment','logistics','government','communication','marketplace','custom'], required: true },
  provider:        { type: String, required: true },
  status:          { type: String, enum: ['active','inactive','error','configuring'], default: 'inactive' },
  auth_type:       { type: String, enum: ['api_key','oauth2','basic','bearer','none'], default: 'api_key' },
  base_url:        { type: String },
  config:          { type: mongoose.Schema.Types.Mixed, default: {} },
  credentials:     { type: mongoose.Schema.Types.Mixed, default: {} },
  field_mappings:  { type: mongoose.Schema.Types.Mixed, default: {} },
  sync_direction:  { type: String, enum: ['inbound','outbound','bidirectional'], default: 'bidirectional' },
  sync_frequency:  { type: String, enum: ['realtime','hourly','daily','weekly','manual'], default: 'daily' },
  last_sync_at:    { type: Date },
  last_sync_status:{ type: String, enum: ['success','failed','partial','never'], default: 'never' },
  total_syncs:     { type: Number, default: 0 },
  health_score:    { type: Number, default: 100 },
  version:         { type: String, default: '1.0' },
  tags:            [{ type: String }],
  created_by:      { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

module.exports = mongoose.model('IntegrationConnector', IntegrationConnectorSchema);
