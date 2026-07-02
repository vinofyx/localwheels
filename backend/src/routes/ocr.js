const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Document = require('../models/Document');
const OCRResult = require('../models/OCRResult');
const OCRJob = require('../models/OCRJob');
const DocumentQueue = require('../models/DocumentQueue');
const DocumentAudit = require('../models/DocumentAudit');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function runOCR(document) {
  const filePath = path.resolve(document.file_path);
  if (!fs.existsSync(filePath)) throw new Error('File not found: ' + filePath);

  const ext = path.extname(document.file_path).toLowerCase();
  const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'].includes(ext);
  const isPDF = ext === '.pdf';

  let content;
  if (isImage) {
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = document.mime_type || 'image/jpeg';
    content = [
      { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Data } },
      { type: 'text', text: `You are an expert OCR system for logistics documents. Extract ALL text from this document and identify all fields.

Return a JSON object with:
{
  "raw_text": "complete extracted text",
  "confidence": 0.0-1.0,
  "detected_doc_type": "invoice|lr|awb|pod|delivery_challan|packing_list|gst_invoice|eway_bill|driver_license|vehicle_rc|insurance|permit|fitness|puc|fastag|other",
  "extracted_fields": {
    "document_number": "",
    "invoice_number": "",
    "shipment_number": "",
    "lr_number": "",
    "awb_number": "",
    "gst_number": "",
    "customer_name": "",
    "customer_phone": "",
    "origin": "",
    "destination": "",
    "vehicle_number": "",
    "driver_name": "",
    "driver_license": "",
    "weight": "",
    "packages": "",
    "freight": "",
    "insurance": "",
    "tax": "",
    "total_amount": "",
    "issue_date": "",
    "expiry_date": ""
  },
  "tables": [],
  "barcodes": [],
  "qr_codes": [],
  "has_signature": false,
  "has_stamp": false,
  "is_handwritten": false
}` }
    ];
  } else if (isPDF) {
    content = [{ type: 'text', text: 'PDF document uploaded. Extract fields based on document name: ' + document.name }];
  } else {
    content = [{ type: 'text', text: 'Document uploaded: ' + document.name + '. Identify document type from name.' }];
  }

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{ role: 'user', content }],
  });

  const responseText = msg.content[0]?.text || '{}';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in OCR response');
  return JSON.parse(jsonMatch[0]);
}

// GET /api/ocr/jobs — list jobs for company
router.get('/jobs', auth, async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status) filter.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [jobs, total] = await Promise.all([
      OCRJob.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate('document_id', 'name doc_type'),
      OCRJob.countDocuments(filter),
    ]);
    res.json({ jobs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ocr/jobs/:jobId — job status
router.get('/jobs/:jobId', auth, async (req, res) => {
  try {
    const job = await OCRJob.findOne({ _id: req.params.jobId, company_id: req.user.company_id })
      .populate('document_id', 'name doc_type status');
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ocr/queue — queue stats
router.get('/queue', auth, async (req, res) => {
  try {
    const [waiting, processing, done, failed] = await Promise.all([
      DocumentQueue.countDocuments({ company_id: req.user.company_id, status: 'waiting' }),
      DocumentQueue.countDocuments({ company_id: req.user.company_id, status: 'processing' }),
      DocumentQueue.countDocuments({ company_id: req.user.company_id, status: 'done' }),
      DocumentQueue.countDocuments({ company_id: req.user.company_id, status: 'failed' }),
    ]);
    const recent = await DocumentQueue.find({ company_id: req.user.company_id })
      .sort({ createdAt: -1 }).limit(10).populate('document_id', 'name');
    res.json({ stats: { waiting, processing, done, failed }, recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ocr/:docId/reprocess — rerun OCR on existing document
router.post('/:docId/reprocess', auth, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.docId, company_id: req.user.company_id });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const job = await OCRJob.create({
      company_id: req.user.company_id,
      document_id: doc._id,
      status: 'queued',
      triggered_by: req.user._id,
    });

    doc.status = 'ocr_pending';
    await doc.save();

    await DocumentAudit.create({
      document_id: doc._id,
      company_id: req.user.company_id,
      action: 'ocr_reprocessed',
      actor_id: req.user._id,
      actor_name: req.user.name,
    });

    res.json({ message: 'OCR reprocess queued', job_id: job._id });

    setImmediate(async () => {
      try {
        job.status = 'processing';
        job.started_at = new Date();
        await job.save();

        doc.status = 'ocr_processing';
        await doc.save();

        const ocrData = await runOCR(doc);

        await OCRResult.findOneAndUpdate(
          { document_id: doc._id },
          {
            company_id: req.user.company_id,
            document_id: doc._id,
            raw_text: ocrData.raw_text || '',
            confidence: ocrData.confidence || 0,
            detected_doc_type: ocrData.detected_doc_type || doc.doc_type,
            ...ocrData.extracted_fields,
            tables: ocrData.tables || [],
            barcodes: ocrData.barcodes || [],
            qr_codes: ocrData.qr_codes || [],
            has_signature: ocrData.has_signature || false,
            has_stamp: ocrData.has_stamp || false,
            is_handwritten: ocrData.is_handwritten || false,
            processing_time_ms: Date.now() - job.started_at.getTime(),
            model_used: 'claude-haiku-4-5-20251001',
            provider: 'anthropic',
          },
          { upsert: true, new: true }
        );

        doc.ocr_text = ocrData.raw_text || '';
        doc.ocr_confidence = ocrData.confidence || 0;
        doc.extracted_fields = ocrData.extracted_fields || {};
        doc.status = 'ocr_done';
        await doc.save();

        job.status = 'done';
        job.done_at = new Date();
        await job.save();
      } catch (err) {
        job.status = 'failed';
        job.error = err.message;
        await job.save();
        doc.status = 'ocr_done';
        await doc.save();
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ocr/:docId/result — get OCR result for a document
router.get('/:docId/result', auth, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.docId, company_id: req.user.company_id });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    const result = await OCRResult.findOne({ document_id: doc._id });
    res.json({ result, document: { name: doc.name, doc_type: doc.doc_type, status: doc.status } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ocr/:docId/cancel — cancel queued job
router.post('/:docId/cancel', auth, async (req, res) => {
  try {
    const job = await OCRJob.findOne({
      document_id: req.params.docId,
      company_id: req.user.company_id,
      status: 'queued',
    });
    if (!job) return res.status(404).json({ error: 'No queued job found' });
    job.status = 'cancelled';
    await job.save();
    res.json({ message: 'Job cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
