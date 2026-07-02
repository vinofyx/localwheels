const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const WarehouseTask = require('../models/WarehouseTask');
const WarehouseWorker = require('../models/WarehouseWorker');

// GET /api/tasks
router.get('/', auth, async (req, res) => {
  try {
    const { warehouse_id, status, task_type, assigned_to_id, page = 1, limit = 30 } = req.query;
    const q = { company_id: req.user.company_id };
    if (warehouse_id) q.warehouse_id = warehouse_id;
    if (status) q.status = status;
    if (task_type) q.task_type = task_type;
    if (assigned_to_id) q.assigned_to_id = assigned_to_id;
    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      WarehouseTask.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      WarehouseTask.countDocuments(q),
    ]);
    const status_counts = await WarehouseTask.aggregate([
      { $match: { company_id: req.user.company_id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    res.json({ tasks, total, page: Number(page), pages: Math.ceil(total / Number(limit)), status_counts: Object.fromEntries(status_counts.map(s => [s._id, s.count])) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/tasks/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await WarehouseTask.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json({ task });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/tasks
router.post('/', auth, async (req, res) => {
  try {
    const { warehouse_id, task_type, priority, items, assigned_to_id, assigned_to_name, due_at, reference_number, inbound_id, outbound_id } = req.body;
    if (!warehouse_id || !task_type) return res.status(400).json({ error: 'warehouse_id and task_type required' });
    const task = await WarehouseTask.create({
      company_id: req.user.company_id, warehouse_id, task_type, priority, items: items || [],
      assigned_to_id, assigned_to_name, due_at, reference_number, inbound_id, outbound_id,
      total_items: (items || []).length,
    });
    res.status(201).json({ task, message: 'Task created' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/tasks/:id/assign
router.put('/:id/assign', auth, async (req, res) => {
  try {
    const { assigned_to_id, assigned_to_name, worker_id } = req.body;
    const task = await WarehouseTask.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { assigned_to_id, assigned_to_name, worker_id, status: 'assigned' } }, { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json({ task, message: 'Task assigned' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/tasks/:id/start
router.put('/:id/start', auth, async (req, res) => {
  try {
    const task = await WarehouseTask.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { status: 'in_progress', started_at: new Date() } }, { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json({ task, message: 'Task started' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/tasks/:id/complete
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const { items_done, notes } = req.body;
    const task = await WarehouseTask.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!task) return res.status(404).json({ error: 'Not found' });
    task.status = 'completed';
    task.completed_at = new Date();
    if (items_done !== undefined) task.items_done = items_done;
    else task.items_done = task.total_items;
    if (notes) task.notes = notes;
    if (task.started_at) {
      task.actual_duration_min = Math.round((Date.now() - new Date(task.started_at).getTime()) / 60000);
    }
    await task.save();
    // Update worker stats
    if (task.worker_id) {
      await WarehouseWorker.findByIdAndUpdate(task.worker_id, {
        $inc: { tasks_completed_today: 1, tasks_completed_week: 1, tasks_completed_month: 1, total_items_processed: task.items_done },
      });
    }
    res.json({ task, message: 'Task completed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/tasks/:id/item-done — mark individual item done
router.put('/:id/item-done', auth, async (req, res) => {
  try {
    const { item_index } = req.body;
    const task = await WarehouseTask.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!task) return res.status(404).json({ error: 'Not found' });
    if (task.items[item_index]) task.items[item_index].done = true;
    task.items_done = task.items.filter(i => i.done).length;
    if (task.items_done >= task.total_items) task.status = 'completed';
    await task.save();
    res.json({ task });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
