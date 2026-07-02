const mongoose = require('mongoose');

const ExternalSystemSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name:        { type: String, required: true },
  system_type: { type: String, enum: ['erp','crm','accounting','payment','logistics','government','communication','marketplace','custom'], required: true },
  provider:    { type: String },
  base_url:    { type: String },
  environment: { type: String, enum: ['production','staging','sandbox'], default: 'production' },
  status:      { type: String, enum: ['connected','disconnected','error'], default: 'disconnected' },
  last_ping_at:{ type: Date },
  ping_latency_ms: { type: Number },
  description: { type: String },
  notes:       { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ExternalSystem', ExternalSystemSchema);
