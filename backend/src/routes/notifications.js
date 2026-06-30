const express      = require('express');
const router       = express.Router();
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

const ok  = (res, data, message = 'Success', status = 200) => res.status(status).json({ status: true, message, data });
const err = (res, message, status = 400) => res.status(status).json({ status: false, message, errors: [message] });

router.use(authenticate);

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const { is_read, type, page = 1, limit = 30 } = req.query;
    const q = { company_id: req.user.company_id };
    if (is_read !== undefined) q.is_read = is_read === 'true';
    if (type) q.type = type;
    const skip = (Math.max(1, +page) - 1) * Math.min(+limit, 100);
    const lim  = Math.min(+limit, 100);
    const [notifications, total, unread_count] = await Promise.all([
      Notification.find(q).sort({ createdAt: -1 }).skip(skip).limit(lim).lean(),
      Notification.countDocuments(q),
      Notification.countDocuments({ company_id: req.user.company_id, is_read: false }),
    ]);
    ok(res, { notifications, total, unread_count, page: +page, pages: Math.ceil(total / lim) });
  } catch (e) { err(res, e.message, 500); }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { is_read: true }, $addToSet: { read_by: req.user.id } },
      { new: true }
    );
    if (!n) return err(res, 'Notification not found', 404);
    ok(res, n, 'Marked as read');
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/notifications/read-all — mark all as read
router.post('/read-all', async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { company_id: req.user.company_id, is_read: false },
      { $set: { is_read: true }, $addToSet: { read_by: req.user.id } }
    );
    ok(res, { updated: result.modifiedCount }, 'All notifications marked as read');
  } catch (e) { err(res, e.message, 500); }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  try {
    const n = await Notification.findOneAndDelete({ _id: req.params.id, company_id: req.user.company_id });
    if (!n) return err(res, 'Notification not found', 404);
    ok(res, null, 'Notification deleted');
  } catch (e) { err(res, e.message, 500); }
});

// DELETE /api/notifications — clear all read
router.delete('/', async (req, res) => {
  try {
    const result = await Notification.deleteMany({ company_id: req.user.company_id, is_read: true });
    ok(res, { deleted: result.deletedCount }, 'Read notifications cleared');
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
