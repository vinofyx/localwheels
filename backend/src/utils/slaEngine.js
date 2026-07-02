const Complaint      = require('../models/Complaint');
const ComplaintActivity = require('../models/ComplaintActivity');
const { DEFAULT_SLA } = require('./complaintClassifier');

// ─── Check all open complaints for SLA breaches (run periodically) ────────────
async function checkSLABreaches(companyId) {
  const now = new Date();

  // Response SLA breaches (not yet responded, deadline passed)
  await Complaint.updateMany(
    {
      company_id:               companyId,
      first_response_at:        null,
      sla_response_deadline:    { $lt: now },
      is_sla_response_breached: false,
      status:                   { $nin: ['Resolved','Closed','Rejected'] },
    },
    { is_sla_response_breached: true }
  );

  // Resolution SLA breaches
  const resolutionBreached = await Complaint.find({
    company_id:                  companyId,
    sla_resolution_deadline:     { $lt: now },
    is_sla_resolution_breached:  false,
    status:                      { $nin: ['Resolved','Closed','Rejected'] },
  }).select('_id priority').lean();

  for (const c of resolutionBreached) {
    await Complaint.updateOne({ _id: c._id }, { is_sla_resolution_breached: true });
    await ComplaintActivity.create({
      company_id:   companyId,
      complaint_id: c._id,
      actor_role:   'system',
      actor_name:   'System',
      action:       'sla_breach',
      comment:      `Resolution SLA breached for ${c.priority} priority ticket`,
    });
  }

  // Auto-escalate: critical/high tickets breached resolution SLA > 1h ago without escalation
  const escalateThreshold = new Date(now.getTime() - 3600000);
  const toEscalate = await Complaint.find({
    company_id:                 companyId,
    is_sla_resolution_breached: true,
    sla_escalated:              false,
    priority:                   { $in: ['Critical','High'] },
    sla_resolution_deadline:    { $lt: escalateThreshold },
    status:                     { $nin: ['Resolved','Closed','Rejected'] },
  }).lean();

  for (const c of toEscalate) {
    await Complaint.updateOne({ _id: c._id }, {
      sla_escalated:    true,
      sla_escalated_at: now,
      status:           'Escalated',
    });
    await ComplaintActivity.create({
      company_id:   companyId,
      complaint_id: c._id,
      actor_role:   'system',
      actor_name:   'System',
      action:       'sla_escalated',
      comment:      'Auto-escalated: resolution SLA breached by >1 hour',
    });
  }

  return {
    resolution_breached: resolutionBreached.length,
    auto_escalated:      toEscalate.length,
  };
}

// ─── SLA status for a single complaint ───────────────────────────────────────
function getSLAStatus(complaint) {
  const now = new Date();

  const responseBreached  = complaint.first_response_at
    ? false
    : complaint.sla_response_deadline && complaint.sla_response_deadline < now;

  const resolutionBreached = ['Resolved','Closed'].includes(complaint.status)
    ? false
    : complaint.sla_resolution_deadline && complaint.sla_resolution_deadline < now;

  const minutesToResolutionDeadline = complaint.sla_resolution_deadline
    ? Math.round((new Date(complaint.sla_resolution_deadline) - now) / 60000)
    : null;

  return {
    response_breached:    responseBreached,
    resolution_breached:  resolutionBreached,
    minutes_to_deadline:  minutesToResolutionDeadline,
    is_warning:           minutesToResolutionDeadline !== null && minutesToResolutionDeadline < 60 && minutesToResolutionDeadline >= 0,
  };
}

// ─── Dashboard: SLA summary for all open tickets ─────────────────────────────
async function getSLADashboard(companyId) {
  const now = new Date();

  const [openCount, slaResponseBreached, slaResolutionBreached, escalated, criticalOpen] = await Promise.all([
    Complaint.countDocuments({ company_id: companyId, status: { $nin: ['Resolved','Closed','Rejected'] } }),
    Complaint.countDocuments({ company_id: companyId, is_sla_response_breached: true,   status: { $nin: ['Resolved','Closed','Rejected'] } }),
    Complaint.countDocuments({ company_id: companyId, is_sla_resolution_breached: true, status: { $nin: ['Resolved','Closed','Rejected'] } }),
    Complaint.countDocuments({ company_id: companyId, status: 'Escalated' }),
    Complaint.countDocuments({ company_id: companyId, priority: 'Critical', status: { $nin: ['Resolved','Closed','Rejected'] } }),
  ]);

  // Tickets nearing deadline in next 2 hours
  const warningDeadline = new Date(now.getTime() + 2 * 3600000);
  const nearingDeadline = await Complaint.countDocuments({
    company_id:              companyId,
    sla_resolution_deadline: { $gte: now, $lte: warningDeadline },
    status:                  { $nin: ['Resolved','Closed','Rejected'] },
    is_sla_resolution_breached: false,
  });

  return { openCount, slaResponseBreached, slaResolutionBreached, escalated, criticalOpen, nearingDeadline };
}

module.exports = { checkSLABreaches, getSLAStatus, getSLADashboard };
