const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Dock = require('../models/Dock');
const InboundShipment = require('../models/InboundShipment');
const OutboundShipment = require('../models/OutboundShipment');

// GET /api/docks
router.get('/', auth, async (req, res) => {
  try {
    const { warehouse_id, status, dock_type } = req.query;
    const q = { company_id: req.user.company_id };
    if (warehouse_id) q.warehouse_id = warehouse_id;
    if (status) q.status = status;
    if (dock_type) q.dock_type = dock_type;
    const docks = await Dock.find(q).sort({ dock_number: 1 })
      .populate('current_inbound_id', 'inbound_number supplier_name status')
      .populate('current_outbound_id', 'outbound_number customer_name status').lean();
    const available = docks.filter(d => d.status === 'available').length;
    res.json({ docks, total: docks.length, available });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/docks/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const dock = await Dock.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!dock) return res.status(404).json({ error: 'Dock not found' });
    const recentInbound = await InboundShipment.find({ dock_id: req.params.id }).sort({ actual_arrival: -1 }).limit(5).lean();
    const recentOutbound = await OutboundShipment.find({ dock_id: req.params.id }).sort({ dispatched_at: -1 }).limit(5).lean();
    res.json({ dock, recent_inbound: recentInbound, recent_outbound: recentOutbound });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/docks — create dock
router.post('/', auth, async (req, res) => {
  try {
    const { warehouse_id, dock_number, dock_name, dock_type, dock_size, equipment } = req.body;
    if (!warehouse_id || !dock_number) return res.status(400).json({ error: 'warehouse_id and dock_number required' });
    const dock = await Dock.create({ company_id: req.user.company_id, warehouse_id, dock_number, dock_name, dock_type, dock_size, equipment: equipment || [] });
    res.status(201).json({ dock, message: 'Dock created' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/docks/:id/assign — assign vehicle to dock
router.put('/:id/assign', auth, async (req, res) => {
  try {
    const { vehicle_number, inbound_id, outbound_id, expected_free_at } = req.body;
    const dock = await Dock.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!dock) return res.status(404).json({ error: 'Not found' });
    if (dock.status === 'occupied') return res.status(409).json({ error: 'Dock is occupied', dock });
    dock.status = 'occupied';
    dock.current_vehicle_number = vehicle_number;
    dock.current_inbound_id = inbound_id || null;
    dock.current_outbound_id = outbound_id || null;
    dock.occupied_since = new Date();
    dock.expected_free_at = expected_free_at || null;
    dock.total_vehicles_today += 1;
    await dock.save();
    res.json({ dock, message: 'Dock assigned' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/docks/:id/release — release dock
router.put('/:id/release', auth, async (req, res) => {
  try {
    const dock = await Dock.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!dock) return res.status(404).json({ error: 'Not found' });
    if (dock.occupied_since) {
      const mins = (Date.now() - new Date(dock.occupied_since).getTime()) / 60000;
      dock.avg_turnaround_min = dock.avg_turnaround_min ? (dock.avg_turnaround_min + mins) / 2 : mins;
    }
    dock.status = 'available';
    dock.current_vehicle_number = null;
    dock.current_vehicle_id = null;
    dock.current_inbound_id = null;
    dock.current_outbound_id = null;
    dock.occupied_since = null;
    dock.expected_free_at = null;
    await dock.save();
    res.json({ dock, message: 'Dock released' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/docks/:id — general update
router.put('/:id', auth, async (req, res) => {
  try {
    const dock = await Dock.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: req.body }, { new: true }
    );
    if (!dock) return res.status(404).json({ error: 'Not found' });
    res.json({ dock });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/docks/timeline/today — dock schedule for today
router.get('/timeline/today', auth, async (req, res) => {
  try {
    const { warehouse_id } = req.query;
    const q = { company_id: req.user.company_id };
    if (warehouse_id) q.warehouse_id = warehouse_id;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const [inbounds, outbounds, docks] = await Promise.all([
      InboundShipment.find({ company_id: req.user.company_id, ...(warehouse_id ? { warehouse_id } : {}), expected_arrival: { $gte: today, $lt: tomorrow } }).lean(),
      OutboundShipment.find({ company_id: req.user.company_id, ...(warehouse_id ? { warehouse_id } : {}), planned_dispatch_at: { $gte: today, $lt: tomorrow } }).lean(),
      Dock.find(q).lean(),
    ]);
    res.json({ docks, inbound_schedule: inbounds, outbound_schedule: outbounds, date: today });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
