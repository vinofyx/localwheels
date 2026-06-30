const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username:     { type: String },
  action:       { type: String, required: true }, // CREATE, UPDATE, DELETE, LOGIN, STATUS_CHANGE
  resource:     { type: String, required: true }, // Shipment, User, Branch, Payment, etc.
  resource_id:  { type: mongoose.Schema.Types.ObjectId },
  resource_ref: { type: String },
  changes:      { type: mongoose.Schema.Types.Mixed },
  ip_address:   { type: String },
  user_agent:   { type: String },
}, { timestamps: true });

auditLogSchema.index({ company_id: 1, createdAt: -1 });
auditLogSchema.index({ company_id: 1, resource: 1, createdAt: -1 });
auditLogSchema.index({ user_id: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // 90-day TTL

module.exports = mongoose.model('AuditLog', auditLogSchema);
