const AuditLog = require('../models/AuditLog');

async function log({ company_id, user, action, resource, resource_id, resource_ref, changes, req }) {
  try {
    await AuditLog.create({
      company_id,
      user_id:    user?.id,
      username:   user?.username,
      action,
      resource,
      resource_id,
      resource_ref,
      changes,
      ip_address: req?.ip,
      user_agent: req?.get?.('user-agent'),
    });
  } catch {
    // Audit failures must never crash the main request
  }
}

module.exports = { log };
