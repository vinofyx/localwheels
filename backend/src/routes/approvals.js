const router  = require('express').Router();
const { authenticate: auth } = require('../middleware/auth');
const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const ApprovalRequest  = require('../models/ApprovalRequest');
const ApprovalHistory  = require('../models/ApprovalHistory');

const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// ── Approval Workflow Definitions ──────────────────────────────────────────
router.get('/workflows', auth, async (req, res) => {
  try {
    const wfs = await ApprovalWorkflow.find({ company_id: req.user.company_id }).sort({ createdAt: -1 }).lean();
    ok(res, { workflows: wfs, total: wfs.length });
  } catch (e) { err(res, e.message, 500); }
});

router.post('/workflows', auth, async (req, res) => {
  try {
    const wf = await ApprovalWorkflow.create({ ...req.body, company_id: req.user.company_id, created_by: req.user.id });
    ok(res, wf, 'Approval workflow created', 201);
  } catch (e) { err(res, e.message); }
});

// ── Approval Requests ──────────────────────────────────────────────────────
router.get('/requests', auth, async (req, res) => {
  try {
    const { status, entity_type, mine, limit = 20, page = 1 } = req.query;
    const cid = req.user.company_id;
    const filter = { company_id: cid };
    if (status)      filter.status      = status;
    if (entity_type) filter.entity_type = entity_type;
    if (mine === 'true') filter.requested_by = req.user.id;
    const skip = (page - 1) * limit;
    const [requests, total] = await Promise.all([
      ApprovalRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(+limit)
        .populate('requested_by', 'name').lean(),
      ApprovalRequest.countDocuments(filter),
    ]);
    ok(res, { requests, total, page: +page, pages: Math.ceil(total / limit) });
  } catch (e) { err(res, e.message, 500); }
});

router.get('/requests/:id', auth, async (req, res) => {
  try {
    const request = await ApprovalRequest.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('requested_by', 'name').lean();
    if (!request) return err(res, 'Request not found', 404);
    const history = await ApprovalHistory.find({ request_id: request._id }).sort({ createdAt: 1 }).lean();
    ok(res, { request, history });
  } catch (e) { err(res, e.message, 500); }
});

router.post('/requests', auth, async (req, res) => {
  try {
    const { workflow_id, entity_type, entity_id, entity_ref, title, description, amount, metadata } = req.body;
    if (!title || !entity_type) return err(res, 'title and entity_type required');

    let totalSteps = 1;
    let wfName = null;
    if (workflow_id) {
      const wf = await ApprovalWorkflow.findById(workflow_id).lean();
      if (wf) { totalSteps = wf.steps.length; wfName = wf.name; }
    }

    const request = await ApprovalRequest.create({
      company_id: req.user.company_id, workflow_id, workflow_name: wfName,
      entity_type, entity_id, entity_ref, title, description, amount,
      requested_by: req.user.id, requester_name: req.user.name,
      total_steps: totalSteps, metadata,
      due_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });

    await ApprovalHistory.create({
      company_id: req.user.company_id, request_id: request._id,
      step_number: 1, action: 'submitted',
      actor_id: req.user.id, actor_name: req.user.name,
      comment: 'Request submitted for approval',
    });

    ok(res, request, 'Approval request submitted', 201);
  } catch (e) { err(res, e.message); }
});

router.post('/requests/:id/approve', auth, async (req, res) => {
  try {
    const request = await ApprovalRequest.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!request) return err(res, 'Not found', 404);
    if (!['pending','in_review'].includes(request.status)) return err(res, 'Cannot approve in current state');

    const isLastStep = request.current_step >= request.total_steps;
    request.status       = isLastStep ? 'approved' : 'in_review';
    request.current_step = Math.min(request.current_step + 1, request.total_steps);
    if (isLastStep) request.completed_at = new Date();
    await request.save();

    await ApprovalHistory.create({
      company_id: req.user.company_id, request_id: request._id,
      step_number: request.current_step - 1, action: 'approved',
      actor_id: req.user.id, actor_name: req.user.name,
      comment: req.body.comment || 'Approved',
    });
    ok(res, request, isLastStep ? 'Request approved' : 'Step approved, moving to next');
  } catch (e) { err(res, e.message, 500); }
});

router.post('/requests/:id/reject', auth, async (req, res) => {
  try {
    const request = await ApprovalRequest.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!request) return err(res, 'Not found', 404);
    if (!['pending','in_review'].includes(request.status)) return err(res, 'Cannot reject in current state');
    request.status = 'rejected'; request.completed_at = new Date();
    await request.save();
    await ApprovalHistory.create({
      company_id: req.user.company_id, request_id: request._id,
      step_number: request.current_step, action: 'rejected',
      actor_id: req.user.id, actor_name: req.user.name,
      comment: req.body.comment || 'Rejected',
    });
    ok(res, request, 'Request rejected');
  } catch (e) { err(res, e.message, 500); }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [total, pending, approved, rejected] = await Promise.all([
      ApprovalRequest.countDocuments({ company_id: cid }),
      ApprovalRequest.countDocuments({ company_id: cid, status: 'pending' }),
      ApprovalRequest.countDocuments({ company_id: cid, status: 'approved' }),
      ApprovalRequest.countDocuments({ company_id: cid, status: 'rejected' }),
    ]);
    ok(res, { total, pending, approved, rejected, in_review: total - pending - approved - rejected });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
