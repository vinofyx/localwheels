const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Document = require('../models/Document');
const OCRResult = require('../models/OCRResult');
const DocumentValidation = require('../models/DocumentValidation');
const DocumentApproval = require('../models/DocumentApproval');
const DocumentAnalytics = require('../models/DocumentAnalytics');

// GET /api/document-analytics/summary — KPI summary
router.get('/summary', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [
      total,
      pending,
      approved,
      rejected,
      duplicates,
      expiring,
      highFraud,
      ocrDone,
    ] = await Promise.all([
      Document.countDocuments({ company_id: cid, is_deleted: false }),
      Document.countDocuments({ company_id: cid, is_deleted: false, approval_status: 'pending' }),
      Document.countDocuments({ company_id: cid, is_deleted: false, approval_status: 'approved' }),
      Document.countDocuments({ company_id: cid, is_deleted: false, approval_status: 'rejected' }),
      Document.countDocuments({ company_id: cid, is_deleted: false, is_duplicate: true }),
      Document.countDocuments({
        company_id: cid,
        is_deleted: false,
        expiry_date: { $gte: new Date(), $lte: new Date(Date.now() + 30 * 86400000) },
      }),
      Document.countDocuments({ company_id: cid, is_deleted: false, fraud_risk: 'high' }),
      Document.countDocuments({ company_id: cid, is_deleted: false, status: { $in: ['ocr_done', 'validation_done', 'approved'] } }),
    ]);

    const ocrResults = await OCRResult.aggregate([
      { $match: { company_id: cid } },
      { $group: { _id: null, avg_confidence: { $avg: '$confidence' }, avg_processing_ms: { $avg: '$processing_time_ms' } } },
    ]);

    const storageAgg = await Document.aggregate([
      { $match: { company_id: cid, is_deleted: false } },
      { $group: { _id: null, total_bytes: { $sum: '$size_bytes' } } },
    ]);

    res.json({
      total,
      pending,
      approved,
      rejected,
      duplicates,
      expiring_soon: expiring,
      high_fraud_risk: highFraud,
      ocr_processed: ocrDone,
      ocr_avg_confidence: ocrResults[0]?.avg_confidence ? Math.round(ocrResults[0].avg_confidence * 100) : 0,
      avg_processing_ms: Math.round(ocrResults[0]?.avg_processing_ms || 0),
      storage_bytes: storageAgg[0]?.total_bytes || 0,
      approval_rate: total > 0 ? Math.round((approved / total) * 100) : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/document-analytics/by-type — breakdown by document type
router.get('/by-type', auth, async (req, res) => {
  try {
    const agg = await Document.aggregate([
      { $match: { company_id: req.user.company_id, is_deleted: false } },
      { $group: { _id: '$doc_type', count: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ['$approval_status', 'approved'] }, 1, 0] } } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ by_type: agg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/document-analytics/by-status — breakdown by status
router.get('/by-status', auth, async (req, res) => {
  try {
    const agg = await Document.aggregate([
      { $match: { company_id: req.user.company_id, is_deleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ by_status: agg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/document-analytics/trend — upload trend (last 30 days)
router.get('/trend', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const from = new Date();
    from.setDate(from.getDate() - parseInt(days));

    const agg = await Document.aggregate([
      { $match: { company_id: req.user.company_id, createdAt: { $gte: from } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          uploads: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$approval_status', 'approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$approval_status', 'rejected'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ trend: agg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/document-analytics/ocr-accuracy — OCR performance stats
router.get('/ocr-accuracy', auth, async (req, res) => {
  try {
    const agg = await OCRResult.aggregate([
      { $match: { company_id: req.user.company_id } },
      {
        $group: {
          _id: '$detected_doc_type',
          count: { $sum: 1 },
          avg_confidence: { $avg: '$confidence' },
          avg_processing_ms: { $avg: '$processing_time_ms' },
          handwritten: { $sum: { $cond: ['$is_handwritten', 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ]);
    res.json({ ocr_accuracy: agg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/document-analytics/validation-summary — validation pass/fail rates
router.get('/validation-summary', auth, async (req, res) => {
  try {
    const agg = await DocumentValidation.aggregate([
      { $match: { company_id: req.user.company_id } },
      {
        $group: {
          _id: '$is_valid',
          count: { $sum: 1 },
          avg_score: { $avg: '$score' },
        },
      },
    ]);
    const fraud = await DocumentValidation.aggregate([
      { $match: { company_id: req.user.company_id } },
      { $group: { _id: '$fraud_risk', count: { $sum: 1 } } },
    ]);
    res.json({ validation: agg, fraud_risk: fraud });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/document-analytics/snapshot — create daily analytics snapshot
router.post('/snapshot', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, ocrDone, ocrFailed, approved, rejected, duplicates, fraud] = await Promise.all([
      Document.countDocuments({ company_id: cid, createdAt: { $gte: today } }),
      Document.countDocuments({ company_id: cid, status: 'ocr_done', updatedAt: { $gte: today } }),
      Document.countDocuments({ company_id: cid, status: 'ocr_done', ocr_confidence: { $lt: 0.5 } }),
      Document.countDocuments({ company_id: cid, approval_status: 'approved', updatedAt: { $gte: today } }),
      Document.countDocuments({ company_id: cid, approval_status: 'rejected', updatedAt: { $gte: today } }),
      Document.countDocuments({ company_id: cid, is_duplicate: true, createdAt: { $gte: today } }),
      Document.countDocuments({ company_id: cid, fraud_risk: 'high', createdAt: { $gte: today } }),
    ]);

    const ocrAgg = await OCRResult.aggregate([
      { $match: { company_id: cid, createdAt: { $gte: today } } },
      { $group: { _id: null, avg_confidence: { $avg: '$confidence' }, avg_ms: { $avg: '$processing_time_ms' } } },
    ]);

    const storageAgg = await Document.aggregate([
      { $match: { company_id: cid, is_deleted: false } },
      { $group: { _id: null, total: { $sum: '$size_bytes' } } },
    ]);

    const snapshot = await DocumentAnalytics.findOneAndUpdate(
      { company_id: cid, period: 'daily', period_date: today },
      {
        uploads_total: total,
        ocr_processed: ocrDone,
        ocr_avg_confidence: ocrAgg[0]?.avg_confidence || 0,
        ocr_failed: ocrFailed,
        approved,
        rejected,
        duplicates_found: duplicates,
        fraud_detected: fraud,
        avg_processing_ms: ocrAgg[0]?.avg_ms || 0,
        storage_bytes: storageAgg[0]?.total || 0,
      },
      { upsert: true, new: true }
    );

    res.json({ snapshot, message: 'Snapshot created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
