const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Document = require('../models/Document');
const DocumentApproval = require('../models/DocumentApproval');
const DocumentValidation = require('../models/DocumentValidation');
const DocumentAudit = require('../models/DocumentAudit');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/document-approval/:docId/ai-review — AI pre-review
router.post('/:docId/ai-review', auth, async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.docId, company_id: req.user.company_id });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const validation = await DocumentValidation.findOne({ document_id: doc._id });
    let aiDecision = 'pending';
    let aiNotes = '';

    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Review this logistics document for approval. Type: ${doc.doc_type}. Name: ${doc.name}. Validation score: ${validation?.score || 'N/A'}. Errors: ${JSON.stringify(validation?.errors || [])}. Fraud risk: ${validation?.fraud_risk || 'unknown'}.

Respond with JSON: {"decision": "approve|reject|escalate", "notes": "brief explanation", "confidence": 0.0-1.0}`,
        }],
      });
      const txt = msg.content[0]?.text || '{}';
      const jm = txt.match(/\{[\s\S]*\}/);
      if (jm) {
        const r = JSON.parse(jm[0]);
        aiDecision = r.decision || 'pending';
        aiNotes = r.notes || '';
      }
    } catch (_) {
      aiDecision = validation?.is_valid ? 'approve' : 'escalate';
      aiNotes = 'AI review unavailable — based on validation score';
    }

    let approval = await DocumentApproval.findOne({ document_id: doc._id });
    if (!approval) {
      approval = new DocumentApproval({
        document_id: doc._id,
        company_id: req.user.company_id,
        current_stage: 'ai_reviewed',
        history: [],
      });
    }

    approval.ai_decision = aiDecision;
    approval.ai_notes = aiNotes;
    approval.ai_reviewed_at = new Date();
    approval.current_stage = 'ai_reviewed';
    approval.history.push({
      stage: 'ai_reviewed',
      action: 'ai_review',
      actor_name: 'AI System',
      notes: aiNotes,
      timestamp: new Date(),
    });
    await approval.save();

    doc.status = 'approval_pending';
    doc.approval_status = aiDecision === 'approve' ? 'approved' : aiDecision === 'reject' ? 'rejected' : 'pending';
    if (aiDecision === 'approve') doc.status = 'approved';
    await doc.save();

    await DocumentAudit.create({
      document_id: doc._id,
      company_id: req.user.company_id,
      action: 'ai_reviewed',
      actor_name: 'AI System',
      metadata: { ai_decision: aiDecision, ai_notes: aiNotes },
    });

    res.json({ approval, ai_decision: aiDecision, ai_notes: aiNotes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/document-approval/:docId/approve — manual approve
router.post('/:docId/approve', auth, async (req, res) => {
  try {
    const { notes } = req.body;
    const doc = await Document.findOne({ _id: req.params.docId, company_id: req.user.company_id });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    let approval = await DocumentApproval.findOne({ document_id: doc._id });
    if (!approval) {
      approval = new DocumentApproval({
        document_id: doc._id,
        company_id: req.user.company_id,
        current_stage: 'pending',
        history: [],
      });
    }

    approval.current_stage = 'approved';
    approval.approved_by = req.user._id;
    approval.approved_at = new Date();
    approval.history.push({
      stage: 'approved',
      action: 'approved',
      actor_id: req.user._id,
      actor_name: req.user.name,
      notes: notes || '',
      timestamp: new Date(),
    });
    await approval.save();

    doc.status = 'approved';
    doc.approval_status = 'approved';
    doc.approved_by = req.user._id;
    doc.approved_at = new Date();
    await doc.save();

    await DocumentAudit.create({
      document_id: doc._id,
      company_id: req.user.company_id,
      action: 'approved',
      actor_id: req.user._id,
      actor_name: req.user.name,
      metadata: { notes },
    });

    res.json({ approval, message: 'Document approved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/document-approval/:docId/reject
router.post('/:docId/reject', auth, async (req, res) => {
  try {
    const { notes, reason } = req.body;
    const doc = await Document.findOne({ _id: req.params.docId, company_id: req.user.company_id });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    let approval = await DocumentApproval.findOne({ document_id: doc._id });
    if (!approval) {
      approval = new DocumentApproval({
        document_id: doc._id,
        company_id: req.user.company_id,
        current_stage: 'pending',
        history: [],
      });
    }

    approval.current_stage = 'rejected';
    approval.rejected_by = req.user._id;
    approval.rejected_at = new Date();
    approval.rejection_reason = reason || notes || '';
    approval.history.push({
      stage: 'rejected',
      action: 'rejected',
      actor_id: req.user._id,
      actor_name: req.user.name,
      notes: reason || notes || '',
      timestamp: new Date(),
    });
    await approval.save();

    doc.status = 'rejected';
    doc.approval_status = 'rejected';
    await doc.save();

    await DocumentAudit.create({
      document_id: doc._id,
      company_id: req.user.company_id,
      action: 'rejected',
      actor_id: req.user._id,
      actor_name: req.user.name,
      metadata: { reason: reason || notes },
    });

    res.json({ approval, message: 'Document rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/document-approval/:docId/escalate
router.post('/:docId/escalate', auth, async (req, res) => {
  try {
    const { notes, escalate_to } = req.body;
    const doc = await Document.findOne({ _id: req.params.docId, company_id: req.user.company_id });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    let approval = await DocumentApproval.findOne({ document_id: doc._id });
    if (!approval) {
      approval = new DocumentApproval({
        document_id: doc._id,
        company_id: req.user.company_id,
        current_stage: 'pending',
        history: [],
      });
    }

    approval.current_stage = 'supervisor_review';
    approval.history.push({
      stage: 'supervisor_review',
      action: 'escalated',
      actor_id: req.user._id,
      actor_name: req.user.name,
      notes: notes || '',
      timestamp: new Date(),
    });
    await approval.save();

    doc.approval_status = 'pending';
    await doc.save();

    await DocumentAudit.create({
      document_id: doc._id,
      company_id: req.user.company_id,
      action: 'escalated',
      actor_id: req.user._id,
      actor_name: req.user.name,
      metadata: { notes, escalate_to },
    });

    res.json({ approval, message: 'Document escalated for supervisor review' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/document-approval/:docId/request-correction
router.post('/:docId/request-correction', auth, async (req, res) => {
  try {
    const { notes } = req.body;
    const doc = await Document.findOne({ _id: req.params.docId, company_id: req.user.company_id });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    let approval = await DocumentApproval.findOne({ document_id: doc._id });
    if (!approval) {
      approval = new DocumentApproval({
        document_id: doc._id,
        company_id: req.user.company_id,
        current_stage: 'pending',
        history: [],
      });
    }

    approval.current_stage = 'correction_required';
    approval.history.push({
      stage: 'correction_required',
      action: 'correction_requested',
      actor_id: req.user._id,
      actor_name: req.user.name,
      notes: notes || '',
      timestamp: new Date(),
    });
    await approval.save();

    doc.status = 'correction_required';
    doc.approval_status = 'correction_required';
    await doc.save();

    res.json({ approval, message: 'Correction requested' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/document-approval/:docId — get approval record
router.get('/:docId', auth, async (req, res) => {
  try {
    const approval = await DocumentApproval.findOne({
      document_id: req.params.docId,
      company_id: req.user.company_id,
    }).populate('approved_by rejected_by', 'name email');
    if (!approval) return res.status(404).json({ error: 'No approval record found' });
    res.json({ approval });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/document-approval — list pending approvals
router.get('/', auth, async (req, res) => {
  try {
    const { stage, limit = 20, page = 1 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (stage) filter.current_stage = stage;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [results, total] = await Promise.all([
      DocumentApproval.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate('document_id', 'name doc_type')
        .populate('approved_by rejected_by', 'name'),
      DocumentApproval.countDocuments(filter),
    ]);
    res.json({ results, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
