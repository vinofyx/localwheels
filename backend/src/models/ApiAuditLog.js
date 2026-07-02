const mongoose = require('mongoose');

const ApiAuditLogSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  api_key_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'ApiKey' },
  application_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'ApiApplication' },
  user_id:       { type: mongoose.Schema.Types.ObjectId },
  method:        { type: String },
  path:          { type: String },
  status_code:   { type: Number },
  duration_ms:   { type: Number },
  request_size:  { type: Number },
  response_size: { type: Number },
  ip_address:    { type: String },
  user_agent:    { type: String },
  error:         { type: String },
  tags:          [{ type: String }],
}, { timestamps: { createdAt: 'logged_at', updatedAt: false } });

ApiAuditLogSchema.index({ logged_at: -1 });
ApiAuditLogSchema.index({ company_id: 1, logged_at: -1 });

module.exports = mongoose.model('ApiAuditLog', ApiAuditLogSchema);
