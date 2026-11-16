const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  event_type: {
    type: String,
    required: true,
    enum: [
      'admin_bootstrap',
      'admin_created',
      'user_created',
      'role_changed',
      'user_deactivated',
      'user_activated',
      'branch_transfer',
      'security_violation',
      'privilege_escalation_attempt',
      'password_change',
    ],
    index: true,
  },
  performed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  performed_by_username: {
    type: String,
    default: 'system',
  },
  target_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  target_username: {
    type: String,
    default: null,
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null,
    index: true,
  },
  branch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    default: null,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ip_address: {
    type: String,
    default: null,
  },
}, { timestamps: true });

auditLogSchema.index({ company_id: 1, createdAt: -1 });
auditLogSchema.index({ event_type: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
