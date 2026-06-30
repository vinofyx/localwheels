const express  = require('express');
const router   = express.Router();
const FAQ      = require('../models/FAQ');
const { authenticate, requireRole } = require('../middleware/auth');

const ok  = (res, data, message = 'Success', status = 200) => res.status(status).json({ status: true, message, data });
const err = (res, message, status = 400) => res.status(status).json({ status: false, message, errors: [message] });

// GET /api/faq — public
router.get('/', async (req, res) => {
  try {
    const { category, search, company_id } = req.query;
    const q = { is_published: true, $or: [{ company_id: null }] };
    if (company_id) q.$or.push({ company_id });
    if (category) q.category = category;
    if (search) {
      q.$text = { $search: search };
    }
    const faqs = await FAQ.find(q).sort({ sort_order: 1, helpful_yes: -1 }).lean();
    const categories = [...new Set(faqs.map(f => f.category))];
    ok(res, { faqs, categories, total: faqs.length });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/faq/:id — public
router.get('/:id', async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq || !faq.is_published) return err(res, 'FAQ not found', 404);
    faq.view_count += 1;
    await faq.save();
    ok(res, faq);
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/faq/:id/helpful — public vote
router.post('/:id/helpful', async (req, res) => {
  try {
    const { vote } = req.body; // 'yes' | 'no'
    if (!['yes', 'no'].includes(vote)) return err(res, 'vote must be yes or no');
    const update = vote === 'yes' ? { $inc: { helpful_yes: 1 } } : { $inc: { helpful_no: 1 } };
    await FAQ.findByIdAndUpdate(req.params.id, update);
    ok(res, null, 'Vote recorded');
  } catch (e) { err(res, e.message, 500); }
});

// ── Admin routes (require auth) ───────────────────────────────────────────────
router.use(authenticate);

// POST /api/faq
router.post('/', requireRole('admin', 'superadmin', 'manager'), async (req, res) => {
  try {
    const { question, answer, category, tags, sort_order, is_published } = req.body;
    if (!question || !answer) return err(res, 'question and answer are required');
    const company_id = req.user.company_id;
    const faq = await FAQ.create({ company_id, question, answer, category, tags, sort_order, is_published, created_by: req.user.id });
    ok(res, faq, 'FAQ created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/faq/:id
router.put('/:id', requireRole('admin', 'superadmin', 'manager'), async (req, res) => {
  try {
    const faq = await FAQ.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: req.body }, { new: true, runValidators: true }
    );
    if (!faq) return err(res, 'FAQ not found', 404);
    ok(res, faq, 'FAQ updated');
  } catch (e) { err(res, e.message, 500); }
});

// DELETE /api/faq/:id
router.delete('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const faq = await FAQ.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { is_published: false } }, { new: true }
    );
    if (!faq) return err(res, 'FAQ not found', 404);
    ok(res, null, 'FAQ unpublished');
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/faq/admin/all — manage all (including unpublished)
router.get('/admin/all', requireRole('admin', 'superadmin', 'manager'), async (req, res) => {
  try {
    const faqs = await FAQ.find({ company_id: req.user.company_id })
      .sort({ sort_order: 1, createdAt: -1 }).lean();
    ok(res, { faqs, total: faqs.length });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
