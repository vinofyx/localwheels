const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Document = require('../models/Document');
const OCRResult = require('../models/OCRResult');

// GET /api/document-search — full-text + metadata search
router.get('/', auth, async (req, res) => {
  try {
    const {
      q,
      doc_type,
      status,
      approval_status,
      folder_id,
      tag,
      customer_name,
      vehicle_number,
      driver_name,
      shipment_number,
      lr_number,
      date_from,
      date_to,
      expiry_from,
      expiry_to,
      has_ocr,
      fraud_risk,
      sort = 'createdAt',
      order = 'desc',
      limit = 20,
      page = 1,
    } = req.query;

    const filter = {
      company_id: req.user.company_id,
      is_deleted: false,
    };

    if (doc_type) filter.doc_type = doc_type;
    if (status) filter.status = status;
    if (approval_status) filter.approval_status = approval_status;
    if (folder_id) filter.folder_id = folder_id;
    if (fraud_risk) filter.fraud_risk = fraud_risk;
    if (has_ocr === 'true') filter.ocr_text = { $exists: true, $ne: '' };

    if (date_from || date_to) {
      filter.createdAt = {};
      if (date_from) filter.createdAt.$gte = new Date(date_from);
      if (date_to) filter.createdAt.$lte = new Date(date_to);
    }

    if (expiry_from || expiry_to) {
      filter.expiry_date = {};
      if (expiry_from) filter.expiry_date.$gte = new Date(expiry_from);
      if (expiry_to) filter.expiry_date.$lte = new Date(expiry_to);
    }

    // Tag filter
    if (tag) filter.tags = tag;

    // Extracted field filters (from embedded extracted_fields)
    const fieldFilters = [];
    if (customer_name) fieldFilters.push({ 'extracted_fields.customer_name': { $regex: customer_name, $options: 'i' } });
    if (vehicle_number) fieldFilters.push({ 'extracted_fields.vehicle_number': { $regex: vehicle_number, $options: 'i' } });
    if (driver_name) fieldFilters.push({ 'extracted_fields.driver_name': { $regex: driver_name, $options: 'i' } });
    if (shipment_number) fieldFilters.push({ 'extracted_fields.shipment_number': { $regex: shipment_number, $options: 'i' } });
    if (lr_number) fieldFilters.push({ 'extracted_fields.lr_number': { $regex: lr_number, $options: 'i' } });

    let docIds = null;

    // Full-text search on OCR text (regex fallback — no text index required)
    if (q) {
      const ocrMatches = await OCRResult.find(
        { raw_text: { $regex: q, $options: 'i' }, company_id: req.user.company_id },
        { document_id: 1 }
      ).limit(200);

      const nameMatches = await Document.find({
        company_id: req.user.company_id,
        name: { $regex: q, $options: 'i' },
      }, { _id: 1 }).limit(100);

      const ocrDocIds = ocrMatches.map(r => r.document_id.toString());
      const nameDocIds = nameMatches.map(d => d._id.toString());
      const allIds = [...new Set([...ocrDocIds, ...nameDocIds])];

      if (allIds.length === 0) {
        return res.json({ results: [], total: 0, page: parseInt(page), pages: 0 });
      }
      docIds = allIds;
    }

    if (docIds) filter._id = { $in: docIds };
    if (fieldFilters.length > 0) Object.assign(filter, ...fieldFilters);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

    const [results, total] = await Promise.all([
      Document.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('folder_id', 'name')
        .select('-ocr_text'),
      Document.countDocuments(filter),
    ]);

    res.json({
      results,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      query: q || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/document-search/suggestions — autocomplete suggestions
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ suggestions: [] });

    const docs = await Document.find({
      company_id: req.user.company_id,
      is_deleted: false,
      name: { $regex: q, $options: 'i' },
    }, { name: 1, doc_type: 1 }).limit(10);

    const suggestions = docs.map(d => ({ id: d._id, name: d.name, doc_type: d.doc_type }));
    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/document-search/expiry-alerts — documents expiring soon
router.get('/expiry-alerts', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + parseInt(days));

    const docs = await Document.find({
      company_id: req.user.company_id,
      is_deleted: false,
      expiry_date: { $gte: new Date(), $lte: cutoff },
    }).sort({ expiry_date: 1 }).limit(50);

    res.json({ alerts: docs, count: docs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/document-search/duplicates — list duplicate documents
router.get('/duplicates', auth, async (req, res) => {
  try {
    const docs = await Document.find({
      company_id: req.user.company_id,
      is_duplicate: true,
      is_deleted: false,
    }).sort({ createdAt: -1 }).limit(50);
    res.json({ duplicates: docs, count: docs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
