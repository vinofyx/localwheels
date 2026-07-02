const express = require('express');
const router = express.Router();
const { authenticate: auth, requireRole } = require('../middleware/auth');
const Supplier = require('../models/Supplier');
const SupplierScorecard = require('../models/SupplierScorecard');
const PurchaseOrder = require('../models/PurchaseOrder');
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic();

const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg, status = 400) => res.status(status).json({ status: false, message: msg });

// GET /api/suppliers
router.get('/', auth, async (req, res) => {
  try {
    const { status, category, search, limit = 20, page = 1 } = req.query;
    const q = { company_id: req.user.company_id, is_active: true };
    if (status) q.status = status;
    if (category) q.category = category;
    if (search) q.name = { $regex: search, $options: 'i' };
    const skip = (Number(page) - 1) * Number(limit);
    const [suppliers, total] = await Promise.all([
      Supplier.find(q).sort({ name: 1 }).skip(skip).limit(Number(limit)).lean(),
      Supplier.countDocuments(q),
    ]);
    ok(res, { suppliers, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/suppliers/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!supplier) return err(res, 'Supplier not found', 404);
    const [scorecard, recentPOs] = await Promise.all([
      SupplierScorecard.findOne({ supplier_id: supplier._id }).sort({ period_date: -1 }).lean(),
      PurchaseOrder.find({ supplier_id: supplier._id }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);
    ok(res, { supplier, scorecard, recent_pos: recentPOs });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/suppliers
router.post('/', auth, async (req, res) => {
  try {
    const { name, category, contact_person, email, phone, address, city, state, country, tax_id, payment_terms } = req.body;
    if (!name) return err(res, 'name required');
    const count = await Supplier.countDocuments({ company_id: req.user.company_id });
    const supplier_code = `SUP-${String(count + 1).padStart(4, '0')}`;
    const supplier = await Supplier.create({ company_id: req.user.company_id, supplier_code, name, category, contact_person, email, phone, address, city, state, country, tax_id, payment_terms });
    ok(res, supplier, 'Supplier registered', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/suppliers/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: req.body }, { new: true, runValidators: true }
    );
    if (!supplier) return err(res, 'Supplier not found', 404);
    ok(res, supplier, 'Supplier updated');
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/suppliers/:id/approve
router.post('/:id/approve', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { status: 'approved', approved_by: req.user.id, approved_at: new Date() } },
      { new: true }
    );
    if (!supplier) return err(res, 'Supplier not found', 404);
    ok(res, supplier, 'Supplier approved');
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/suppliers/:id/scorecard
router.post('/:id/scorecard', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!supplier) return err(res, 'Supplier not found', 404);

    const { on_time_delivery = 85, quality_score = 80, price_competitiveness = 75, responsiveness = 90, sla_compliance = 88, defect_rate = 2, orders_count = 0, total_spend = 0, late_deliveries = 0, rejected_items = 0 } = req.body;
    const overall = Math.round((on_time_delivery * 0.3) + (quality_score * 0.25) + (price_competitiveness * 0.15) + (responsiveness * 0.15) + (sla_compliance * 0.15));
    const grade = overall >= 90 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : overall >= 60 ? 'D' : 'F';

    let ai_summary = '', recommendations = [];
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001', max_tokens: 400,
        messages: [{ role: 'user', content: `Supplier: ${supplier.name}, Score: ${overall}/100, Grade: ${grade}. On-time: ${on_time_delivery}%, Quality: ${quality_score}%, Defect rate: ${defect_rate}%. Write a 2-sentence performance summary and 3 improvement recommendations as JSON: {"summary":"...","recommendations":["...","...","..."]}` }],
      });
      const j = JSON.parse(msg.content[0].text.match(/\{[\s\S]*\}/)?.[0] || '{}');
      ai_summary = j.summary || '';
      recommendations = j.recommendations || [];
    } catch { /* skip AI on error */ }

    const scorecard = await SupplierScorecard.create({
      company_id: req.user.company_id, supplier_id: supplier._id,
      period: 'monthly', period_date: new Date(),
      on_time_delivery, quality_score, price_competitiveness, responsiveness, sla_compliance, defect_rate,
      overall_score: overall, grade, orders_count, total_spend, late_deliveries, rejected_items,
      ai_summary, recommendations,
    });
    await Supplier.findByIdAndUpdate(supplier._id, { overall_score: overall, on_time_delivery, quality_score, sla_compliance });
    ok(res, scorecard, 'Scorecard generated', 201);
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/suppliers/analytics/summary
router.get('/analytics/summary', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [total, active, approved, pending, topSuppliers] = await Promise.all([
      Supplier.countDocuments({ company_id: cid }),
      Supplier.countDocuments({ company_id: cid, status: 'active' }),
      Supplier.countDocuments({ company_id: cid, status: 'approved' }),
      Supplier.countDocuments({ company_id: cid, status: 'pending' }),
      Supplier.find({ company_id: cid, status: { $in: ['active','approved'] } }).sort({ overall_score: -1 }).limit(5).lean(),
    ]);
    const totalSpend = await PurchaseOrder.aggregate([
      { $match: { company_id: require('mongoose').Types.ObjectId.createFromHexString(String(cid)) } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } },
    ]);
    ok(res, { total, active, approved, pending, top_suppliers: topSuppliers, total_spend: totalSpend[0]?.total || 0 });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
