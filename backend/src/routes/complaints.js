const express   = require('express');
const router    = express.Router();
const Complaint = require('../models/Complaint');
const Shipment  = require('../models/Shipment');
const Notification = require('../models/Notification');
const { authenticate, requireRole } = require('../middleware/auth');
const audit = require('../utils/audit');

const ok  = (res, data, message = 'Success', status = 200) => res.status(status).json({ status: true, message, data });
const err = (res, message, status = 400) => res.status(status).json({ status: false, message, errors: [message] });

function genTicketId() {
  return `LWC-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

// POST /api/complaints — public (chatbot, customer portal)
router.post('/', async (req, res) => {
  try {
    const { issue_type, description, lr_number, contact_name, contact_phone, contact_email, source = 'portal' } = req.body;
    if (!issue_type || !description)
      return err(res, 'issue_type and description are required');

    let company_id = null, shipment_id = null;
    if (lr_number) {
      const s = await Shipment.findOne({ lr_number: lr_number.trim().toUpperCase() });
      if (s) { company_id = s.company_id; shipment_id = s._id; }
    }

    const c = await Complaint.create({
      company_id, shipment_id,
      ticket_id: genTicketId(),
      lr_number: lr_number?.trim().toUpperCase(),
      issue_type, description, contact_name, contact_phone, contact_email, source,
    });

    // Create notification for branch staff if company resolved
    if (company_id) {
      await Notification.create({
        company_id,
        type: 'complaint_new',
        title: `New Complaint: ${c.ticket_id}`,
        message: `${issue_type.replace('_', ' ')} — ${description.slice(0, 100)}`,
        reference_id: c._id,
        reference_type: 'Complaint',
        priority: issue_type === 'lost' || issue_type === 'damaged' ? 'high' : 'medium',
      }).catch(() => {});
    }

    ok(res, {
      ticket_id:      c.ticket_id,
      status:         c.status,
      resolution_sla: '24–48 hours',
    }, 'Complaint registered', 201);
  } catch (e) { err(res, e.message, 500); }
});

// All routes below require auth
router.use(authenticate);

// GET /api/complaints
router.get('/', async (req, res) => {
  try {
    const { status, issue_type, source, page = 1, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id };
    if (status)     q.status = status;
    if (issue_type) q.issue_type = issue_type;
    if (source)     q.source = source;
    const skip = (Math.max(1, +page) - 1) * Math.min(+limit, 100);
    const lim  = Math.min(+limit, 100);
    const [complaints, total] = await Promise.all([
      Complaint.find(q).sort({ createdAt: -1 }).skip(skip).limit(lim)
        .populate('assigned_to', 'full_name username').lean(),
      Complaint.countDocuments(q),
    ]);
    ok(res, { complaints, total, page: +page, pages: Math.ceil(total / lim) });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/complaints/ticket/:ticketId — public lookup
router.get('/ticket/:ticketId', async (req, res) => {
  try {
    const c = await Complaint.findOne({ ticket_id: req.params.ticketId.toUpperCase() }).lean();
    if (!c) return err(res, 'Ticket not found', 404);
    ok(res, { ticket_id: c.ticket_id, status: c.status, issue_type: c.issue_type, createdAt: c.createdAt, resolved_at: c.resolved_at });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/complaints/:id
router.get('/:id', async (req, res) => {
  try {
    const c = await Complaint.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('shipment_id', 'lr_number status').populate('assigned_to', 'full_name').lean();
    if (!c) return err(res, 'Complaint not found', 404);
    ok(res, c);
  } catch (e) { err(res, e.message, 500); }
});

// PATCH /api/complaints/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, resolution } = req.body;
    const allowed = ['open', 'in_progress', 'resolved', 'closed'];
    if (!allowed.includes(status)) return err(res, `status must be one of: ${allowed.join(', ')}`);
    const update = { status };
    if (resolution) update.resolution = resolution;
    if (status === 'resolved') update.resolved_at = new Date();
    const c = await Complaint.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: update }, { new: true }
    );
    if (!c) return err(res, 'Complaint not found', 404);
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'STATUS_CHANGE', resource: 'Complaint', resource_id: c._id, resource_ref: c.ticket_id, changes: { status }, req });
    ok(res, c, 'Complaint updated');
  } catch (e) { err(res, e.message, 500); }
});

// PATCH /api/complaints/:id/assign
router.patch('/:id/assign', requireRole('admin', 'superadmin', 'manager'), async (req, res) => {
  try {
    const { user_id } = req.body;
    const c = await Complaint.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { assigned_to: user_id, status: 'in_progress' } }, { new: true }
    );
    if (!c) return err(res, 'Complaint not found', 404);
    ok(res, c, 'Complaint assigned');
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
