const mongoose = require('mongoose');

const ConnectorConfigurationSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  connector_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'IntegrationConnector', required: true },
  config_key:    { type: String, required: true },
  config_value:  { type: mongoose.Schema.Types.Mixed },
  is_secret:     { type: Boolean, default: false },
  description:   { type: String },
  updated_by:    { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

ConnectorConfigurationSchema.index({ connector_id: 1, config_key: 1 });

module.exports = mongoose.model('ConnectorConfiguration', ConnectorConfigurationSchema);
