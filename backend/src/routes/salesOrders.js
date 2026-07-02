const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const SalesOrder = require('../models/SalesOrder');

const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg, status = 400) => res.status(status).json({ status: false, message: msg });

// GET /api/sales-orders
router.get('/', auth, async (req, res) => {
  try {
    const { status, search, limit = 20, page = 1 } = req.query;
    const q = { company_id: req.user.company_id };
    if (status) q.status = status;
    if (search) q.$or = [{ order_number: { $regex: search, $options: 'i' } }, { customer_name: { $regex: search, $options: 'i' } }];
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      SalesOrder.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      SalesOrder.countDocuments(q),
    ]);
    ok(res, { orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/sales-orders/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await SalesOrder.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!order) return err(res, 'Sales order not found', 404);
    ok(res, order);
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/sales-orders
router.post('/', auth, async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, delivery_address, delivery_city, items = [], requested_date, priority, notes } = req.body;
    if (!customer_name || !items.length) return err(res, 'customer_name and items required');
    const count = await SalesOrder.countDocuments({ company_id: req.user.company_id });
    const order_number = `SO-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${String(count+1).padStart(4,'0')}`;
    const processedItems = items.map(i => {
      const base = (i.quantity || 0) * (i.unit_price || 0);
      const discount = base * ((i.discount_pct || 0) / 100);
      return { ...i, total_price: base - discount };
    });
    const subtotal = processedItems.reduce((s, i) => s + i.total_price, 0);
    const tax_amount = subtotal * 0.16;
    const order = await SalesOrder.create({
      company_id: req.user.company_id, order_number, customer_name, customer_email, customer_phone,
      delivery_address, delivery_city, items: processedItems,
      subtotal, tax_amount, total_amount: subtotal + tax_amount,
      requested_date, priority, notes, created_by: req.user.id, status: 'confirmed',
    });
    ok(res, order, 'Sales order created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/sales-orders/:id/status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['draft','confirmed','processing','allocated','partially_fulfilled','fulfilled','shipped','delivered','cancelled','returned'];
    if (!validStatuses.includes(status)) return err(res, 'Invalid status');
    const update = { status };
    if (status === 'delivered') update.delivered_date = new Date();
    const order = await SalesOrder.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: update }, { new: true }
    );
    if (!order) return err(res, 'Order not found', 404);
    ok(res, order, 'Status updated');
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/sales-orders/analytics/summary
router.get('/analytics/summary', auth, async (req, res) => {
  try {
    const ObjId = require('mongoose').Types.ObjectId;
    const cid = ObjId.isValid(req.user.company_id) ? new ObjId(req.user.company_id) : req.user.company_id;
    const [counts, revenue] = await Promise.all([
      SalesOrder.aggregate([
        { $match: { company_id: cid } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      SalesOrder.aggregate([
        { $match: { company_id: cid } },
        { $group: { _id: null, total: { $sum: '$total_amount' }, paid: { $sum: '$paid_amount' } } },
      ]),
    ]);
    const statusMap = {};
    counts.forEach(c => { statusMap[c._id] = c.count; });
    ok(res, { status_breakdown: statusMap, total_revenue: revenue[0]?.total || 0, collected: revenue[0]?.paid || 0 });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
