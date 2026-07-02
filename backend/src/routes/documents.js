const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const crypto   = require('crypto');
const Anthropic = require('@anthropic-ai/sdk');
const { authenticate: auth } = require('../middleware/auth');

const Document        = require('../models/Document');
const DocumentFolder  = require('../models/DocumentFolder');
const DocumentVersion = require('../models/DocumentVersion');
const DocumentAudit   = require('../models/DocumentAudit');
const DocumentQueue   = require('../models/DocumentQueue');
const OCRJob          = require('../models/OCRJob');
const OCRResult       = require('../models/OCRResult');
const DocumentValidation = require('../models/DocumentValidation');
const DocumentApproval   = require('../models/DocumentApproval');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Storage ────────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const safe = crypto.randomBytes(12).toString('hex');
    cb(null, `${Date.now()}_${safe}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /pdf|jpg|jpeg|png|webp|gif|tiff|bmp|heic|doc|docx|xls|xlsx/i;
    cb(null, allowed.test(path.extname(file.originalname)));
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fileUrl(filename) { return `/uploads/documents/${filename}`; }
function fileChecksum(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(data).digest('hex');
  } catch { return null; }
}

async function auditLog(documentId, companyId, action, actorId, actorName, details = {}) {
  try {
    await DocumentAudit.create({ document_id: documentId, company_id: companyId, action, actor_id: actorId, actor_name: actorName, details });
  } catch {}
}

async function enqueueOCR(documentId, companyId, userId, priority = 5) {
  const job = await OCRJob.create({ company_id: companyId, document_id: documentId, status: 'queued', priority, requested_by: userId });
  await DocumentQueue.create({ company_id: companyId, document_id: documentId, job_type: 'ocr', status: 'waiting', priority, payload: { job_id: job._id } });
  return job._id;
}

// ─── OCR Processing ─────────────────────────────────────────────────────────
async function runOCR(document) {
  const startMs = Date.now();
  const filePath = path.join(__dirname, '../../uploads/documents', path.basename(document.file_path || ''));

  if (!fs.existsSync(filePath)) throw new Error('File not found for OCR');

  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString('base64');
  const mimeType   = document.mime_type || 'image/jpeg';

  const prompt = `You are an expert document OCR and data extraction AI for a logistics company.
Analyze this document and respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "document_type": "invoice|lr|awb|pod|delivery_challan|packing_list|gst_invoice|eway_bill|driver_license|vehicle_rc|insurance|permit|fitness|puc|fastag|customer_doc|vendor_doc|purchase_bill|fuel_bill|other",
  "document_type_confidence": 0-100,
  "raw_text": "full extracted text from document",
  "confidence": 0-100,
  "has_signature": true|false,
  "has_stamp": true|false,
  "is_handwritten": true|false,
  "barcodes": [],
  "qr_codes": [],
  "fields": {
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
  }
}
Leave fields empty string if not found. Be precise.`;

  let content;
  if (mimeType.startsWith('image/') || mimeType === 'image/jpeg') {
    const safeType = ['image/jpeg','image/png','image/gif','image/webp'].includes(mimeType) ? mimeType : 'image/jpeg';
    content = [
      { type: 'image', source: { type: 'base64', media_type: safeType, data: base64Data } },
      { type: 'text', text: prompt },
    ];
  } else {
    // PDF or other — use text prompt with metadata
    content = [{ type: 'text', text: `${prompt}\n\nDocument filename: ${document.original_name}\nMIME type: ${mimeType}\nNote: This is a non-image document. Extract what you can from the filename and respond with best-effort JSON.` }];
  }

  const msg = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages:   [{ role: 'user', content }],
  });

  const raw     = msg.content[0]?.text || '{}';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  let parsed;
  try { parsed = JSON.parse(cleaned); } catch { parsed = { raw_text: raw, confidence: 30, document_type: 'other', document_type_confidence: 30, fields: {} }; }

  return {
    raw_text:            parsed.raw_text || '',
    confidence:          parsed.confidence || 0,
    detected_doc_type:   parsed.document_type || 'other',
    doc_type_confidence: parsed.document_type_confidence || 0,
    extracted_fields:    parsed.fields || {},
    has_signature:       parsed.has_signature || false,
    has_stamp:           parsed.has_stamp || false,
    is_handwritten:      parsed.is_handwritten || false,
    barcodes:            parsed.barcodes || [],
    qr_codes:            parsed.qr_codes || [],
    processing_time_ms:  Date.now() - startMs,
  };
}

// Fallback OCR when AI is unavailable
function fallbackOCR(document) {
  return {
    raw_text:            `[OCR not available - AI key not configured] File: ${document.original_name}`,
    confidence:          0,
    detected_doc_type:   'other',
    doc_type_confidence: 0,
    extracted_fields:    {},
    has_signature:       false,
    has_stamp:           false,
    is_handwritten:      false,
    barcodes:            [],
    qr_codes:            [],
    processing_time_ms:  0,
  };
}

// Auto-link document to other modules
async function autoLink(document, fields) {
  const updates = {};
  try {
    const Shipment = require('../models/Shipment');
    const Vehicle  = require('../models/Vehicle');
    const Driver   = require('../models/Driver');
    const Customer = require('../models/Customer');

    if (fields.lr_number) {
      const s = await Shipment.findOne({ company_id: document.company_id, lr_number: fields.lr_number }).lean();
      if (s) { updates.linked_shipment_id = s._id; updates.linked_lr = fields.lr_number; }
    }
    if (fields.vehicle_number) {
      const v = await Vehicle.findOne({ company_id: document.company_id, vehicle_number: { $regex: fields.vehicle_number, $options: 'i' } }).lean();
      if (v) updates.linked_vehicle_id = v._id;
    }
    if (fields.driver_name || fields.driver_license) {
      const dq = {};
      if (fields.driver_name)    dq.name    = { $regex: fields.driver_name, $options: 'i' };
      if (fields.driver_license) dq.license_number = fields.driver_license;
      const d = await Driver.findOne({ company_id: document.company_id, ...dq }).lean();
      if (d) updates.linked_driver_id = d._id;
    }
    if (fields.customer_name) {
      const c = await Customer.findOne({ company_id: document.company_id, name: { $regex: fields.customer_name, $options: 'i' } }).lean();
      if (c) updates.linked_customer_id = c._id;
    }
  } catch {}
  return updates;
}

// ─── GET /  — list documents ─────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { folder_id, doc_type, status, approval_status, is_favorite, is_deleted = 'false',
            is_archived = 'false', search, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    const filter = {
      company_id: req.user.company_id,
      is_deleted: is_deleted === 'true',
      is_archived: is_archived === 'true',
    };

    if (folder_id)       filter.folder_id       = folder_id;
    if (doc_type)        filter.doc_type         = doc_type;
    if (status)          filter.status           = status;
    if (approval_status) filter.approval_status  = approval_status;
    if (is_favorite === 'true') filter.is_favorite = true;
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [docs, total] = await Promise.all([
      Document.find(filter).sort(sort).skip(skip).limit(Number(limit))
        .populate('uploaded_by', 'name').populate('folder_id', 'name').lean(),
      Document.countDocuments(filter),
    ]);

    res.json({ documents: docs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /stats ──────────────────────────────────────────────────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const base = { company_id: cid, is_deleted: false };

    const [total, pending_ocr, pending_approval, approved, rejected, expiring] = await Promise.all([
      Document.countDocuments(base),
      Document.countDocuments({ ...base, status: { $in: ['ocr_pending','ocr_processing'] } }),
      Document.countDocuments({ ...base, approval_status: { $in: ['pending','ai_reviewed','supervisor_review'] } }),
      Document.countDocuments({ ...base, approval_status: 'approved' }),
      Document.countDocuments({ ...base, approval_status: 'rejected' }),
      Document.countDocuments({ ...base, expiry_date: { $gte: new Date(), $lte: new Date(Date.now() + 30*24*60*60*1000) } }),
    ]);

    const byType = await Document.aggregate([
      { $match: base },
      { $group: { _id: '$doc_type', count: { $sum: 1 } } },
    ]);

    res.json({ total, pending_ocr, pending_approval, approved, rejected, expiring, by_type: byType });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /folders ─────────────────────────────────────────────────────────────
router.get('/folders', auth, async (req, res) => {
  try {
    const folders = await DocumentFolder.find({ company_id: req.user.company_id })
      .sort({ name: 1 }).lean();
    res.json({ folders });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /folders ────────────────────────────────────────────────────────────
router.post('/folders', auth, async (req, res) => {
  try {
    const { name, parent_id, color, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Folder name required' });
    const folder = await DocumentFolder.create({ company_id: req.user.company_id, name, parent_id: parent_id || null, color, description, created_by: req.user.id });
    res.json({ folder });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /upload ─────────────────────────────────────────────────────────────
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  try {
    const { folder_id, category_id, doc_type, tags, notes } = req.body;
    const checksum = fileChecksum(req.file.path);

    // Duplicate detection by checksum
    const dupCheck = await Document.findOne({ company_id: req.user.company_id, checksum, is_deleted: false }).lean();

    const doc = await Document.create({
      company_id:    req.user.company_id,
      branch_id:     req.user.branch_id,
      folder_id:     folder_id || null,
      category_id:   category_id || null,
      name:          req.file.originalname,
      original_name: req.file.originalname,
      file_path:     req.file.path,
      file_url:      fileUrl(req.file.filename),
      mime_type:     req.file.mimetype,
      size_bytes:    req.file.size,
      doc_type:      doc_type || 'other',
      status:        'ocr_pending',
      tags:          tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      notes,
      checksum,
      is_duplicate:  !!dupCheck,
      duplicate_of:  dupCheck?._id || null,
      uploaded_by:   req.user.id,
    });

    await auditLog(doc._id, req.user.company_id, 'uploaded', req.user.id, req.user.name);

    // Kick off OCR immediately if AI key is set
    const jobId = await enqueueOCR(doc._id, req.user.company_id, req.user.id);

    // Process OCR in background (non-blocking)
    setImmediate(async () => {
      try {
        await Document.findByIdAndUpdate(doc._id, { status: 'ocr_processing' });
        await OCRJob.findByIdAndUpdate(jobId, { status: 'processing', started_at: new Date() });

        let result;
        if (process.env.ANTHROPIC_API_KEY) {
          result = await runOCR(doc);
        } else {
          result = fallbackOCR(doc);
        }

        const ocrResult = await OCRResult.create({
          document_id: doc._id, company_id: req.user.company_id, job_id: jobId,
          raw_text: result.raw_text, confidence: result.confidence,
          detected_doc_type: result.detected_doc_type, doc_type_confidence: result.doc_type_confidence,
          extracted_fields: result.extracted_fields,
          has_signature: result.has_signature, has_stamp: result.has_stamp, is_handwritten: result.is_handwritten,
          barcodes: result.barcodes, qr_codes: result.qr_codes,
          processing_time_ms: result.processing_time_ms,
        });

        const linkUpdates = await autoLink(doc, result.extracted_fields || {});

        await Document.findByIdAndUpdate(doc._id, {
          status: 'ocr_done', ocr_text: result.raw_text, ocr_confidence: result.confidence,
          extracted_fields: result.extracted_fields,
          doc_type: result.detected_doc_type || doc.doc_type,
          ocr_job_id: jobId, ocr_processed_at: new Date(),
          expiry_date: result.extracted_fields?.expiry_date ? new Date(result.extracted_fields.expiry_date) : undefined,
          ...linkUpdates,
        });

        await OCRJob.findByIdAndUpdate(jobId, { status: 'done', completed_at: new Date(), result_id: ocrResult._id, processing_time_ms: result.processing_time_ms });
        await DocumentQueue.findOneAndUpdate({ document_id: doc._id, status: 'waiting' }, { status: 'done', done_at: new Date() });
      } catch (err) {
        await Document.findByIdAndUpdate(doc._id, { status: 'ocr_pending' });
        await OCRJob.findByIdAndUpdate(jobId, { status: 'failed', error: err.message, failed_at: new Date() });
      }
    });

    res.json({ document: doc, ocr_job_id: jobId, is_duplicate: !!dupCheck });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /upload/bulk ────────────────────────────────────────────────────────
router.post('/upload/bulk', auth, upload.array('files', 20), async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'No files provided' });
  try {
    const { folder_id, doc_type } = req.body;
    const results = [];

    for (const file of req.files) {
      const checksum = fileChecksum(file.path);
      const dupCheck = await Document.findOne({ company_id: req.user.company_id, checksum, is_deleted: false }).lean();
      const doc = await Document.create({
        company_id: req.user.company_id, branch_id: req.user.branch_id,
        folder_id: folder_id || null, name: file.originalname, original_name: file.originalname,
        file_path: file.path, file_url: fileUrl(file.filename), mime_type: file.mimetype,
        size_bytes: file.size, doc_type: doc_type || 'other', status: 'ocr_pending',
        checksum, is_duplicate: !!dupCheck, duplicate_of: dupCheck?._id || null, uploaded_by: req.user.id,
      });
      await enqueueOCR(doc._id, req.user.company_id, req.user.id, 3);
      results.push({ document_id: doc._id, name: file.originalname, is_duplicate: !!dupCheck });
    }

    res.json({ uploaded: results.length, documents: results });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /:id ─────────────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('uploaded_by', 'name email').populate('folder_id', 'name').populate('approved_by', 'name').lean();
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const [ocrResult, validation, approval, audit] = await Promise.all([
      OCRResult.findOne({ document_id: doc._id }).sort({ createdAt: -1 }).lean(),
      DocumentValidation.findOne({ document_id: doc._id }).sort({ createdAt: -1 }).lean(),
      DocumentApproval.findOne({ document_id: doc._id }).sort({ createdAt: -1 }).lean(),
      DocumentAudit.find({ document_id: doc._id }).sort({ timestamp: -1 }).limit(20).lean(),
    ]);

    await Document.findByIdAndUpdate(doc._id, { $inc: { view_count: 1 }, last_accessed: new Date() });
    await auditLog(doc._id, req.user.company_id, 'viewed', req.user.id, req.user.name);

    res.json({ document: doc, ocr_result: ocrResult, validation, approval, audit });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PUT /:id ─────────────────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const allowed = ['name','folder_id','category_id','doc_type','tags','notes','is_favorite'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      updates, { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    await auditLog(doc._id, req.user.company_id, 'renamed', req.user.id, req.user.name, updates);
    res.json({ document: doc });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /:id/favorite ───────────────────────────────────────────────────────
router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    doc.is_favorite = !doc.is_favorite;
    await doc.save();
    res.json({ is_favorite: doc.is_favorite });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /:id/archive ────────────────────────────────────────────────────────
router.post('/:id/archive', auth, async (req, res) => {
  try {
    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { is_archived: true, archived_at: new Date(), status: 'archived' },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    await auditLog(doc._id, req.user.company_id, 'archived', req.user.id, req.user.name);
    res.json({ document: doc });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── DELETE /:id  (soft delete) ───────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { is_deleted: true, deleted_at: new Date(), deleted_by: req.user.id, status: 'deleted' },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found' });
    await auditLog(doc._id, req.user.company_id, 'deleted', req.user.id, req.user.name);
    res.json({ message: 'Document moved to recycle bin' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /:id/restore ────────────────────────────────────────────────────────
router.post('/:id/restore', auth, async (req, res) => {
  try {
    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id, is_deleted: true },
      { is_deleted: false, deleted_at: null, deleted_by: null, status: 'ocr_done' },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Not found or not deleted' });
    await auditLog(doc._id, req.user.company_id, 'restored', req.user.id, req.user.name);
    res.json({ document: doc });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /:id/versions ────────────────────────────────────────────────────────
router.get('/:id/versions', auth, async (req, res) => {
  try {
    const versions = await DocumentVersion.find({ document_id: req.params.id, company_id: req.user.company_id })
      .sort({ version: -1 }).populate('created_by', 'name').lean();
    res.json({ versions });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── POST /:id/version  — upload new version ──────────────────────────────────
router.post('/:id/version', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  try {
    const doc = await Document.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!doc) return res.status(404).json({ error: 'Not found' });

    await DocumentVersion.create({
      document_id: doc._id, company_id: req.user.company_id, version: doc.version,
      file_path: doc.file_path, file_url: doc.file_url, size_bytes: doc.size_bytes,
      mime_type: doc.mime_type, ocr_text: doc.ocr_text, extracted_fields: doc.extracted_fields,
      change_notes: req.body.change_notes, created_by: req.user.id, checksum: doc.checksum,
    });

    const newChecksum = fileChecksum(req.file.path);
    await doc.updateOne({
      version: doc.version + 1, file_path: req.file.path, file_url: fileUrl(req.file.filename),
      mime_type: req.file.mimetype, size_bytes: req.file.size, checksum: newChecksum,
      status: 'ocr_pending', ocr_text: null, ocr_confidence: 0, extracted_fields: {},
    });

    const jobId = await enqueueOCR(doc._id, req.user.company_id, req.user.id);
    await auditLog(doc._id, req.user.company_id, 'version_created', req.user.id, req.user.name, { version: doc.version + 1 });

    res.json({ message: 'New version uploaded', version: doc.version + 1, ocr_job_id: jobId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /:id/audit ───────────────────────────────────────────────────────────
router.get('/:id/audit', auth, async (req, res) => {
  try {
    const audit = await DocumentAudit.find({ document_id: req.params.id, company_id: req.user.company_id })
      .sort({ timestamp: -1 }).limit(50).lean();
    res.json({ audit });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── GET /:id/download ────────────────────────────────────────────────────────
router.get('/:id/download', auth, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });

    await Document.findByIdAndUpdate(doc._id, { $inc: { download_count: 1 } });
    await auditLog(doc._id, req.user.company_id, 'downloaded', req.user.id, req.user.name);

    const filePath = doc.file_path;
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ error: 'File not on disk' });
    res.download(filePath, doc.original_name);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
