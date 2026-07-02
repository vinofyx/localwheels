const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const WorkOrder = require('../models/WorkOrder');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const MaintenancePrediction = require('../models/MaintenancePrediction');
const Workshop = require('../models/Workshop');

// GET /api/workorders — list work orders
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, vehicle_id, workshop_id, page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (vehicle_id) filter.fleet_vehicle_id = vehicle_id;
    if (workshop_id) filter.workshop_id = workshop_id;

    const [workOrders, total] = await Promise.all([
      WorkOrder.find(filter)
        .populate('fleet_vehicle_id', 'vehicle_number make model')
        .populate('workshop_id', 'name city')
        .sort({ priority: -1, scheduled_start: 1 })
        .skip((page-1)*limit)
        .limit(parseInt(limit)),
      WorkOrder.countDocuments(filter),
    ]);

    const statusCounts = await WorkOrder.aggregate([
      { $match: { company_id: req.user.company_id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({ workOrders, total, page: parseInt(page), status_counts: statusCounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workorders — create work order
router.post('/', auth, async (req, res) => {
  try {
    const wo = await WorkOrder.create({
      ...req.body,
      company_id: req.user.company_id,
      created_by: req.user.id,
      status: req.body.status || 'open',
    });

    // Update workshop active_work_orders count
    if (wo.workshop_id) {
      await Workshop.updateOne({ _id: wo.workshop_id }, { $inc: { active_work_orders: 1 } });
    }

    // Mark schedule as in_progress if linked
    if (req.body.schedule_id) {
      await MaintenanceSchedule.updateOne({ _id: req.body.schedule_id }, { status: 'in_progress', work_order_id: wo._id });
    }

    const populated = await WorkOrder.findById(wo._id)
      .populate('fleet_vehicle_id', 'vehicle_number make model')
      .populate('workshop_id', 'name city');

    res.status(201).json({ workOrder: populated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workorders/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const wo = await WorkOrder.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('fleet_vehicle_id', 'vehicle_number make model year')
      .populate('workshop_id', 'name city contact_phone labour_rate_per_hr')
      .populate('prediction_id', 'component failure_type failure_probability ai_explanation');
    if (!wo) return res.status(404).json({ error: 'Work order not found' });
    res.json({ workOrder: wo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/workorders/:id — update work order
router.put('/:id', auth, async (req, res) => {
  try {
    const allowed = ['status','priority','title','description','workshop_id','workshop_name','mechanic_name',
      'scheduled_start','estimated_end','actual_start','actual_end','labour_hrs','labour_rate','labour_cost',
      'parts_cost','total_cost','parts_used','diagnosis','work_done','notes','odometer_at_checkin',
      'odometer_at_checkout','pre_checklist_done','post_checklist_done','warranty_claim','warranty_ref',
      'customer_feedback','rating','actual_duration_hrs'];

    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const prev = await WorkOrder.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!prev) return res.status(404).json({ error: 'Work order not found' });

    const wo = await WorkOrder.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      update, { new: true, runValidators: true }
    ).populate('fleet_vehicle_id', 'vehicle_number').populate('workshop_id', 'name');

    // Workshop bay adjustment on status change
    if (update.status && update.status !== prev.status) {
      if (wo.workshop_id) {
        if (['completed','cancelled'].includes(update.status) && !['completed','cancelled'].includes(prev.status)) {
          await Workshop.updateOne({ _id: wo.workshop_id }, { $inc: { active_work_orders: -1, total_work_orders: 1, completed_work_orders: ['completed'].includes(update.status) ? 1 : 0 } });
        }
      }
      if (update.status === 'completed' && wo.schedule_id) {
        await MaintenanceSchedule.updateOne({ _id: wo.schedule_id }, { status: 'completed', completed_date: new Date(), actual_cost: wo.total_cost });
      }
      if (update.status === 'completed' && wo.prediction_id) {
        await MaintenancePrediction.updateOne({ _id: wo.prediction_id }, { status: 'resolved', resolved_at: new Date() });
      }
    }

    res.json({ workOrder: wo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workorders/:id/assign — assign to workshop
router.post('/:id/assign', auth, async (req, res) => {
  try {
    const { workshop_id, mechanic_name, scheduled_start } = req.body;
    if (!workshop_id) return res.status(400).json({ error: 'workshop_id required' });

    const workshop = await Workshop.findOne({ _id: workshop_id, company_id: req.user.company_id });
    if (!workshop) return res.status(404).json({ error: 'Workshop not found' });

    const wo = await WorkOrder.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { workshop_id, workshop_name: workshop.name, mechanic_name, scheduled_start: scheduled_start ? new Date(scheduled_start) : undefined, status: 'assigned' },
      { new: true }
    ).populate('fleet_vehicle_id', 'vehicle_number');
    if (!wo) return res.status(404).json({ error: 'Work order not found' });

    await Workshop.updateOne({ _id: workshop_id }, { $inc: { active_work_orders: 1 } });
    res.json({ workOrder: wo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workorders/:id/close — close work order
router.post('/:id/close', auth, async (req, res) => {
  try {
    const { work_done, actual_duration_hrs, total_cost, labour_cost, parts_cost, parts_used, notes, rating } = req.body;
    const wo = await WorkOrder.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      {
        status: 'completed',
        actual_end: new Date(),
        work_done, actual_duration_hrs, total_cost, labour_cost, parts_cost, parts_used, notes, rating,
        post_checklist_done: true,
        closed_by: req.user.id,
      },
      { new: true }
    ).populate('fleet_vehicle_id', 'vehicle_number').populate('workshop_id', 'name');
    if (!wo) return res.status(404).json({ error: 'Work order not found' });

    if (wo.workshop_id) {
      await Workshop.updateOne({ _id: wo.workshop_id }, { $inc: { active_work_orders: -1, total_work_orders: 1, completed_work_orders: 1 } });
    }
    if (wo.prediction_id) await MaintenancePrediction.updateOne({ _id: wo.prediction_id }, { status: 'resolved', resolved_at: new Date() });
    if (wo.schedule_id) await MaintenanceSchedule.updateOne({ _id: wo.schedule_id }, { status: 'completed', completed_date: new Date(), actual_cost: total_cost });

    res.json({ workOrder: wo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workorders/stats/summary
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [total, open, completed, overdue, costAgg] = await Promise.all([
      WorkOrder.countDocuments({ company_id: cid }),
      WorkOrder.countDocuments({ company_id: cid, status: { $in: ['open','assigned','in_progress'] } }),
      WorkOrder.countDocuments({ company_id: cid, status: 'completed' }),
      WorkOrder.countDocuments({ company_id: cid, status: 'open', scheduled_start: { $lt: new Date() } }),
      WorkOrder.aggregate([{ $match: { company_id: cid, status: 'completed' } }, { $group: { _id: null, total: { $sum: '$total_cost' }, avg: { $avg: '$total_cost' }, avg_duration: { $avg: '$actual_duration_hrs' } } }]),
    ]);
    res.json({ total, open, completed, overdue, total_cost: costAgg[0]?.total || 0, avg_cost: costAgg[0]?.avg || 0, avg_duration_hrs: costAgg[0]?.avg_duration || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
