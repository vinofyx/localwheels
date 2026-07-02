const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');

const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg, status = 400) => res.status(status).json({ status: false, message: msg });

// GET /api/purchase-orders
router.get('/', auth, async (req, res) => {
  try {
    const { status, supplier_id, limit = 20, page = 1 } = req.query;
    const q = { company_id: req.user.company_id };
    if (status) q.status = status;
    if (supplier_id) q.supplier_id = supplier_id;
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      PurchaseOrder.find(q).populate('supplier_id', 'name supplier_code').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      PurchaseOrder.countDocuments(q),
    ]);
    ok(res, { orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/purchase-orders/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('supplier_id', 'name supplier_code email phone').lean();
    if (!order) return err(res, 'PO not found', 404);
    ok(res, order);
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/purchase-orders
router.post('/', auth, async (req, res) => {
  try {
    const { supplier_id, items = [], expected_date, priority, payment_terms, warehouse_id, notes } = req.body;
    if (!supplier_id || !items.length) return err(res, 'supplier_id and items required');
    const supplier = await Supplier.findOne({ _id: supplier_id, company_id: req.user.company_id });
    if (!supplier) return err(res, 'Supplier not found', 404);
    const count = await PurchaseOrder.countDocuments({ company_id: req.user.company_id });
    const po_number = `PO-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${String(count+1).padStart(4,'0')}`;
    const processedItems = items.map(i => ({ ...i, total_price: (i.quantity || 0) * (i.unit_price || 0) }));
    const subtotal = processedItems.reduce((s, i) => s + i.total_price, 0);
    const tax_amount = subtotal * 0.16;
    const order = await PurchaseOrder.create({
      company_id: req.user.company_id, po_number, supplier_id, items: processedItems,
      subtotal, tax_amount, total_amount: subtotal + tax_amount,
      currency: supplier.currency || 'KES', expected_date, priority, payment_terms, warehouse_id, notes,
      created_by: req.user.id,
    });
    ok(res, order, 'Purchase order created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/purchase-orders/:id/approve
router.put('/:id/approve', auth, async (req, res) => {
  try {
    const order = await PurchaseOrder.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id, status: { $in: ['draft','submitted'] } },
      { $set: { status: 'approved', approved_by: req.user.id, approved_at: new Date() } },
      { new: true }
    );
    if (!order) return err(res, 'PO not found or not approvable', 404);
    ok(res, order, 'PO approved');
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/purchase-orders/:id/receive
router.put('/:id/receive', auth, async (req, res) => {
  try {
    const { items = [] } = req.body;
    const order = await PurchaseOrder.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!order) return err(res, 'PO not found', 404);
    items.forEach(recv => {
      const item = order.items.find(i => i.sku === recv.sku);
      if (item) item.received_qty = (item.received_qty || 0) + recv.qty;
    });
    const allReceived = order.items.every(i => (i.received_qty || 0) >= i.quantity);
    const anyReceived = order.items.some(i => (i.received_qty || 0) > 0);
    order.status = allReceived ? 'received' : anyReceived ? 'partially_received' : order.status;
    if (allReceived) order.received_date = new Date();
    await order.save();
    ok(res, order, 'Received updated');
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/purchase-orders/analytics/summary
router.get('/analytics/summary', auth, async (req, res) => {
  try {
    const ObjId = require('mongoose').Types.ObjectId;
    const cid = ObjId.isValid(req.user.company_id) ? new ObjId(req.user.company_id) : req.user.company_id;
    const [counts, spend] = await Promise.all([
      PurchaseOrder.aggregate([
        { $match: { company_id: cid } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      PurchaseOrder.aggregate([
        { $match: { company_id: cid } },
        { $group: { _id: null, total: { $sum: '$total_amount' }, paid: { $sum: '$paid_amount' } } },
      ]),
    ]);
    const statusMap = {};
    counts.forEach(c => { statusMap[c._id] = c.count; });
    ok(res, { status_breakdown: statusMap, total_spend: spend[0]?.total || 0, paid: spend[0]?.paid || 0 });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
