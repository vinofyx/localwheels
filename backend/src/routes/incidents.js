const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Incident = require('../models/Incident');
const IncidentComment = require('../models/IncidentComment');

const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg, status = 400) => res.status(status).json({ status: false, message: msg });

// GET /api/incidents
router.get('/', auth, async (req, res) => {
  try {
    const { status, severity, type, limit = 20, page = 1 } = req.query;
    const q = { company_id: req.user.company_id };
    if (status) q.status = status;
    if (severity) q.severity = severity;
    if (type) q.type = type;
    const skip = (Number(page) - 1) * Number(limit);
    const [incidents, total] = await Promise.all([
      Incident.find(q).populate('assigned_to', 'name email').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Incident.countDocuments(q),
    ]);
    ok(res, { incidents, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/incidents/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const incident = await Incident.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('assigned_to', 'name email').populate('reported_by', 'name').lean();
    if (!incident) return err(res, 'Incident not found', 404);
    const comments = await IncidentComment.find({ incident_id: incident._id }).sort({ createdAt: 1 }).lean();
    ok(res, { incident, comments });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/incidents
router.post('/', auth, async (req, res) => {
  try {
    const { type, severity, title, description, location, entity_type, entity_id, entity_ref, impact, estimated_cost } = req.body;
    if (!title) return err(res, 'title required');
    const count = await Incident.countDocuments({ company_id: req.user.company_id });
    const incident_ref = `INC-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${String(count+1).padStart(4,'0')}`;
    const incident = await Incident.create({
      company_id: req.user.company_id, incident_ref, type, severity, title, description,
      location, entity_type, entity_id, entity_ref, impact, estimated_cost,
      reported_by: req.user.id,
    });
    ok(res, incident, 'Incident created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/incidents/:id/assign
router.put('/:id/assign', auth, async (req, res) => {
  try {
    const { assigned_to } = req.body;
    const incident = await Incident.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { assigned_to, status: 'investigating' } }, { new: true }
    );
    if (!incident) return err(res, 'Incident not found', 404);
    ok(res, incident, 'Incident assigned');
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/incidents/:id/resolve
router.put('/:id/resolve', auth, async (req, res) => {
  try {
    const { resolution, root_cause, actions_taken } = req.body;
    const incident = await Incident.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { status: 'resolved', resolution, root_cause, actions_taken, resolved_by: req.user.id, resolved_at: new Date() } },
      { new: true }
    );
    if (!incident) return err(res, 'Incident not found', 404);
    ok(res, incident, 'Incident resolved');
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/incidents/:id/comments
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text, type } = req.body;
    if (!text) return err(res, 'text required');
    const comment = await IncidentComment.create({
      company_id: req.user.company_id, incident_id: req.params.id,
      author_id: req.user.id, author_name: req.user.name || 'User', text, type,
    });
    ok(res, comment, 'Comment added', 201);
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/incidents/stats/summary
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [total, open, critical, resolved] = await Promise.all([
      Incident.countDocuments({ company_id: cid }),
      Incident.countDocuments({ company_id: cid, status: { $in: ['open','investigating','escalated'] } }),
      Incident.countDocuments({ company_id: cid, severity: 'critical', status: { $ne: 'closed' } }),
      Incident.countDocuments({ company_id: cid, status: 'resolved' }),
    ]);
    ok(res, { total, open, critical, resolved });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
