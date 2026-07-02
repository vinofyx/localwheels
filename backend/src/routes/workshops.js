const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Workshop = require('../models/Workshop');
const WorkOrder = require('../models/WorkOrder');

// GET /api/workshops — list workshops
router.get('/', auth, async (req, res) => {
  try {
    const { status, type, city, page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (city) filter.city = { $regex: city, $options: 'i' };

    const [workshops, total] = await Promise.all([
      Workshop.find(filter).sort({ name: 1 }).skip((page-1)*limit).limit(parseInt(limit)),
      Workshop.countDocuments(filter),
    ]);

    res.json({ workshops, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workshops — create workshop
router.post('/', auth, async (req, res) => {
  try {
    const workshop = await Workshop.create({ ...req.body, company_id: req.user.company_id, created_by: req.user.id });
    res.status(201).json({ workshop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workshops/:id — single workshop with open work orders
router.get('/:id', auth, async (req, res) => {
  try {
    const workshop = await Workshop.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!workshop) return res.status(404).json({ error: 'Workshop not found' });

    const openWOs = await WorkOrder.find({ workshop_id: workshop._id, status: { $in: ['open','assigned','in_progress','awaiting_parts'] } })
      .populate('fleet_vehicle_id', 'vehicle_number')
      .sort({ priority: -1, scheduled_start: 1 })
      .limit(20);

    res.json({ workshop, open_work_orders: openWOs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/workshops/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const workshop = await Workshop.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      req.body, { new: true, runValidators: true }
    );
    if (!workshop) return res.status(404).json({ error: 'Workshop not found' });
    res.json({ workshop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workshops/:id/mechanics — add mechanic
router.post('/:id/mechanics', auth, async (req, res) => {
  try {
    const { name, specialization, experience_years, phone, employee_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Mechanic name required' });
    const workshop = await Workshop.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $push: { mechanics: { name, specialization, experience_years, phone, employee_id, is_available: true } } },
      { new: true }
    );
    if (!workshop) return res.status(404).json({ error: 'Workshop not found' });
    res.json({ workshop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/workshops/:id/mechanics/:mechanicId/availability
router.put('/:id/mechanics/:mechanicId/availability', auth, async (req, res) => {
  try {
    const { is_available } = req.body;
    const workshop = await Workshop.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id, 'mechanics._id': req.params.mechanicId },
      { $set: { 'mechanics.$.is_available': is_available } },
      { new: true }
    );
    if (!workshop) return res.status(404).json({ error: 'Not found' });
    res.json({ workshop });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workshops/stats/summary — workshop performance
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const workshops = await Workshop.find({ company_id: req.user.company_id });
    const stats = await Promise.all(workshops.map(async (ws) => {
      const [open, completed] = await Promise.all([
        WorkOrder.countDocuments({ workshop_id: ws._id, status: { $in: ['open','assigned','in_progress'] } }),
        WorkOrder.countDocuments({ workshop_id: ws._id, status: 'completed' }),
      ]);
      return { _id: ws._id, name: ws.name, type: ws.type, capacity_bays: ws.capacity_bays, open_wos: open, completed_wos: completed, utilization_pct: Math.round((open / (ws.capacity_bays || 1)) * 100) };
    }));
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
