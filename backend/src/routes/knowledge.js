const express = require('express');
const router  = express.Router();

const { authenticate: auth } = require('../middleware/auth');
const { searchKnowledge }    = require('../utils/complaintClassifier');
const KnowledgeArticle       = require('../models/KnowledgeArticle');

// ─── GET /api/knowledge/search ────────────────────────────────────────────────
router.get('/search', auth, async (req, res) => {
  try {
    const { q, category, limit = 5 } = req.query;
    if (!q) return res.status(400).json({ error: 'q (query) required' });

    const articles = await searchKnowledge({ query: q, companyId: req.user.company_id, limit: Number(limit) });
    res.json({ articles, count: articles.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/knowledge ───────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { category, is_internal, page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id, is_published: true };
    if (category)    filter.category    = category;
    if (is_internal !== undefined) filter.is_internal = is_internal === 'true';

    const [articles, total] = await Promise.all([
      KnowledgeArticle.find(filter)
        .select('-content') // exclude heavy content in list view
        .sort('-views')
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      KnowledgeArticle.countDocuments(filter),
    ]);
    res.json({ articles, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/knowledge/:id ───────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const article = await KnowledgeArticle.findOne({
      _id: req.params.id, company_id: req.user.company_id, is_published: true,
    });
    if (!article) return res.status(404).json({ error: 'Article not found' });
    article.views += 1;
    await article.save();
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/knowledge ─────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, summary, category, tags, related_complaint_types, is_internal } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title and content required' });

    const article = await KnowledgeArticle.create({
      company_id: req.user.company_id,
      title, content, summary, category, tags, related_complaint_types, is_internal,
      created_by: req.user._id,
    });
    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/knowledge/:id ───────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const article = await KnowledgeArticle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { ...req.body, updated_by: req.user._id },
      { new: true }
    );
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/knowledge/:id ────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const article = await KnowledgeArticle.findOneAndDelete({ _id: req.params.id, company_id: req.user.company_id });
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/knowledge/:id/helpful ─────────────────────────────────────────
router.post('/:id/helpful', async (req, res) => {
  try {
    const { helpful } = req.body; // true or false
    const field = helpful ? 'helpful_count' : 'not_helpful_count';
    await KnowledgeArticle.updateOne({ _id: req.params.id }, { $inc: { [field]: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
