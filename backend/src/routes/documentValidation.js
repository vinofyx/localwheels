const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Document = require('../models/Document');
const OCRResult = require('../models/OCRResult');
const DocumentValidation = require('../models/DocumentValidation');
const DocumentAudit = require('../models/DocumentAudit');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MANDATORY_FIELDS = {
  invoice: ['document_number', 'customer_name', 'total_amount', 'issue_date'],
  lr: ['lr_number', 'origin', 'destination', 'customer_name'],
  awb: ['awb_number', 'origin', 'destination'],
  pod: ['document_number', 'customer_name'],
  gst_invoice: ['document_number', 'gst_number', 'customer_name', 'total_amount'],
  eway_bill: ['document_number', 'vehicle_number', 'origin', 'destination'],
  driver_license: ['document_number', 'driver_name', 'expiry_date'],
  vehicle_rc: ['document_number', 'vehicle_number'],
  insurance: ['document_number', 'vehicle_number', 'expiry_date'],
  permit: ['document_number', 'vehicle_number', 'expiry_date'],
  fitness: ['document_number', 'vehicle_number', 'expiry_date'],
  puc: ['document_number', 'vehicle_number', 'expiry_date'],
};

function validateGST(gstNumber) {
  if (!gstNumber) return false;
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gstNumber.toUpperCase());
}

function validateVehicleNumber(vn) {
  if (!vn) return false;
  const vnRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;
  return vnRegex.test(vn.toUpperCase().replace(/\s/g, ''));
}

function isExpired(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d < new Date();
}

function isExpiringSoon(dateStr, days = 30) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);
  return d > new Date() && d < cutoff;
}

async function runValidation(doc, ocr) {
  const checks = [];
  const errors = [];
  const warnings = [];
  const fields = ocr?.extracted_fields || doc.extracted_fields || {};
  const docType = doc.doc_type;
  const mandatory = MANDATORY_FIELDS[docType] || [];

  // Mandatory fields check
  const missingFields = mandatory.filter(f => !fields[f]);
  if (missingFields.length === 0) {
    checks.push({ name: 'mandatory_fields', passed: true, message: 'All mandatory fields present' });
  } else {
    checks.push({ name: 'mandatory_fields', passed: false, message: 'Missing: ' + missingFields.join(', ') });
    errors.push({ field: 'mandatory_fields', message: 'Missing required fields: ' + missingFields.join(', ') });
  }

  // OCR confidence check
  const confidence = ocr?.confidence || doc.ocr_confidence || 0;
  if (confidence >= 0.75) {
    checks.push({ name: 'confidence_threshold', passed: true, message: `OCR confidence: ${(confidence * 100).toFixed(1)}%` });
  } else {
    checks.push({ name: 'confidence_threshold', passed: false, message: `Low OCR confidence: ${(confidence * 100).toFixed(1)}%` });
    warnings.push({ field: 'ocr_confidence', message: 'Low OCR confidence — manual review recommended' });
  }

  // GST validation
  if (fields.gst_number) {
    const gstValid = validateGST(fields.gst_number);
    checks.push({ name: 'gst_validation', passed: gstValid, message: gstValid ? 'GST number valid' : 'Invalid GST format' });
    if (!gstValid) errors.push({ field: 'gst_number', message: 'Invalid GST number format' });
  }

  // Vehicle number validation
  if (fields.vehicle_number) {
    const vnValid = validateVehicleNumber(fields.vehicle_number);
    checks.push({ name: 'vehicle_validation', passed: vnValid, message: vnValid ? 'Vehicle number valid' : 'Invalid vehicle number format' });
    if (!vnValid) warnings.push({ field: 'vehicle_number', message: 'Vehicle number format may be invalid' });
  }

  // Expiry checks
  if (fields.expiry_date) {
    const expired = isExpired(fields.expiry_date);
    const expiringSoon = isExpiringSoon(fields.expiry_date);
    if (expired) {
      checks.push({ name: 'expiry_validation', passed: false, message: 'Document has expired' });
      errors.push({ field: 'expiry_date', message: 'Document expired on ' + fields.expiry_date });
    } else if (expiringSoon) {
      checks.push({ name: 'expiry_validation', passed: true, message: 'Document expiring within 30 days' });
      warnings.push({ field: 'expiry_date', message: 'Document expiring soon: ' + fields.expiry_date });
    } else {
      checks.push({ name: 'expiry_validation', passed: true, message: 'Document validity OK' });
    }
  }

  // Duplicate check
  if (doc.is_duplicate) {
    checks.push({ name: 'duplicate_check', passed: false, message: 'Duplicate document detected' });
    errors.push({ field: 'checksum', message: 'Duplicate of existing document' });
  } else {
    checks.push({ name: 'duplicate_check', passed: true, message: 'No duplicates found' });
  }

  // Signature/stamp for compliance docs
  if (['pod', 'delivery_challan', 'invoice'].includes(docType)) {
    if (ocr?.has_signature) {
      checks.push({ name: 'signature_validation', passed: true, message: 'Signature detected' });
    } else {
      checks.push({ name: 'signature_validation', passed: false, message: 'No signature detected' });
      warnings.push({ field: 'signature', message: 'No signature found — may require manual verification' });
    }
  }

  const passedCount = checks.filter(c => c.passed).length;
  const totalCount = checks.length;
  const score = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const is_valid = errors.length === 0;

  // AI fraud check for high-value docs
  let fraud_risk = 'low';
  try {
    if (['invoice', 'gst_invoice', 'eway_bill'].includes(docType) && process.env.ANTHROPIC_API_KEY) {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Analyze this logistics document for fraud risk. Document type: ${docType}. Fields: ${JSON.stringify(fields)}. Respond with JSON: {"fraud_risk": "low|medium|high", "reason": "brief reason"}`,
        }],
      });
      const txt = msg.content[0]?.text || '{}';
      const jm = txt.match(/\{[\s\S]*\}/);
      if (jm) {
        const fr = JSON.parse(jm[0]);
        fraud_risk = fr.fraud_risk || 'low';
        if (fraud_risk === 'high') {
          checks.push({ name: 'fraud_detection', passed: false, message: fr.reason });
          errors.push({ field: 'fraud', message: 'High fraud risk: ' + fr.reason });
        } else {
          checks.push({ name: 'fraud_detection', passed: true, message: 'Fraud risk: ' + fraud_risk });
        }
      }
    }
  } catch (_) { /* non-blocking */ }

  return { checks, errors, warnings, score, is_valid, fraud_risk };
}

// POST /api/document-validation/:docId — validate a document
router.post('/:docId', auth, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.docId, company_id: req.user.company_id });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const ocr = await OCRResult.findOne({ document_id: doc._id });
    const { checks, errors, warnings, score, is_valid, fraud_risk } = await runValidation(doc, ocr);

    const validation = await DocumentValidation.findOneAndUpdate(
      { document_id: doc._id },
      {
        document_id: doc._id,
        company_id: req.user.company_id,
        checks,
        validation_errors: errors,
        warnings,
        score,
        is_valid,
        fraud_risk,
        is_duplicate: doc.is_duplicate || false,
        validated_by: req.user._id,
        validated_at: new Date(),
      },
      { upsert: true, new: true }
    );

    doc.status = 'validation_done';
    doc.fraud_risk = fraud_risk;
    if (!is_valid) doc.approval_status = 'correction_required';
    await doc.save();

    await DocumentAudit.create({
      document_id: doc._id,
      company_id: req.user.company_id,
      action: 'validated',
      actor_id: req.user._id,
      actor_name: req.user.name,
      metadata: { score, is_valid, errors: errors.length },
    });

    res.json({ validation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/document-validation/:docId — get validation result
router.get('/:docId', auth, async (req, res) => {
  try {
    const validation = await DocumentValidation.findOne({
      document_id: req.params.docId,
      company_id: req.user.company_id,
    });
    if (!validation) return res.status(404).json({ error: 'No validation result found' });
    res.json({ validation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/document-validation — list validations with filters
router.get('/', auth, async (req, res) => {
  try {
    const { is_valid, fraud_risk, limit = 20, page = 1 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (is_valid !== undefined) filter.is_valid = is_valid === 'true';
    if (fraud_risk) filter.fraud_risk = fraud_risk;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [results, total] = await Promise.all([
      DocumentValidation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate('document_id', 'name doc_type'),
      DocumentValidation.countDocuments(filter),
    ]);
    res.json({ results, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
