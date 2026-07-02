const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const CollaborationRoom = require('../models/CollaborationRoom');
const EnterpriseTask = require('../models/EnterpriseTask');

const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg, status = 400) => res.status(status).json({ status: false, message: msg });

// ── ROOMS ─────────────────────────────────────────────────────────────────────

router.get('/rooms', auth, async (req, res) => {
  try {
    const rooms = await CollaborationRoom.find({ company_id: req.user.company_id, is_active: true })
      .select('-messages').sort({ updatedAt: -1 }).lean();
    ok(res, { rooms });
  } catch (e) { err(res, e.message, 500); }
});

router.post('/rooms', auth, async (req, res) => {
  try {
    const { name, type, description, members } = req.body;
    if (!name) return err(res, 'name required');
    const room = await CollaborationRoom.create({
      company_id: req.user.company_id, name, type, description,
      members: [...new Set([req.user.id, ...(members || [])])],
      created_by: req.user.id,
    });
    ok(res, room, 'Room created', 201);
  } catch (e) { err(res, e.message, 500); }
});

router.get('/rooms/:id', auth, async (req, res) => {
  try {
    const room = await CollaborationRoom.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!room) return err(res, 'Room not found', 404);
    room.messages = (room.messages || []).slice(-100);
    ok(res, room);
  } catch (e) { err(res, e.message, 500); }
});

router.post('/rooms/:id/messages', auth, async (req, res) => {
  try {
    const { text, type, file_url } = req.body;
    if (!text && !file_url) return err(res, 'text or file_url required');
    const msg = { sender_id: req.user.id, sender_name: req.user.name || 'User', text, type: type || 'text', file_url, sent_at: new Date() };
    const room = await CollaborationRoom.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $push: { messages: msg } }, { new: true }
    );
    if (!room) return err(res, 'Room not found', 404);
    ok(res, msg, 'Message sent');
  } catch (e) { err(res, e.message, 500); }
});

// ── ENTERPRISE TASKS ──────────────────────────────────────────────────────────

router.get('/tasks', auth, async (req, res) => {
  try {
    const { status, assigned_to, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id };
    if (status) q.status = status;
    if (assigned_to) q.assigned_to = assigned_to;
    const tasks = await EnterpriseTask.find(q).populate('assigned_to', 'name email').sort({ due_date: 1, priority: -1 }).limit(Number(limit)).lean();
    ok(res, { tasks, total: tasks.length });
  } catch (e) { err(res, e.message, 500); }
});

router.post('/tasks', auth, async (req, res) => {
  try {
    const { title, description, type, priority, assigned_to, due_date, entity_type, entity_id, entity_ref } = req.body;
    if (!title) return err(res, 'title required');
    const task = await EnterpriseTask.create({
      company_id: req.user.company_id, title, description, type, priority, assigned_to, due_date,
      entity_type, entity_id, entity_ref, assigned_by: req.user.id,
    });
    ok(res, task, 'Task created', 201);
  } catch (e) { err(res, e.message, 500); }
});

router.put('/tasks/:id', auth, async (req, res) => {
  try {
    const { status, approval_note } = req.body;
    const update = { status };
    if (status === 'completed') update.completed_at = new Date();
    if (status === 'approved') { update.approved_by = req.user.id; update.approved_at = new Date(); }
    if (approval_note) update.approval_note = approval_note;
    const task = await EnterpriseTask.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: update }, { new: true }
    );
    if (!task) return err(res, 'Task not found', 404);
    ok(res, task, 'Task updated');
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
