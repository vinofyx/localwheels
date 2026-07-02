const express  = require("express");
const router   = express.Router();

const { genTicketNumber, computeSLADeadlines, classifyComplaint, detectDuplicate } = require("../utils/complaintClassifier");
const { getSLAStatus } = require("../utils/slaEngine");
const { validateAttachment } = require("../utils/attachmentValidator");

const Complaint                     = require("../models/Complaint");
const ComplaintActivity             = require("../models/ComplaintActivity");
const ComplaintAttachment           = require("../models/ComplaintAttachment");
const ComplaintAttachmentValidation = require("../models/ComplaintAttachmentValidation");
const ComplaintFeedback             = require("../models/ComplaintFeedback");
const ComplaintSentiment            = require("../models/ComplaintSentiment");
const Customer                      = require("../models/Customer");
const Shipment                      = require("../models/Shipment");
const Quote                         = require("../models/Quote");

// All customer-portal endpoints are unauthenticated by JWT (no customer login
// system exists yet) and instead verify ownership via phone number, matching
// the pattern already used by the public feedback endpoint in complaints.js.
// This is additive — does not touch the agent/internal /api/complaints routes.

async function logActivity(companyId, complaintId, data) {
  await ComplaintActivity.create({ company_id: companyId, complaint_id: complaintId, ...data });
}

function requirePhone(req, res, next) {
  const phone = req.body.customer_phone || req.query.customer_phone;
  if (!phone) return res.status(400).json({ error: "customer_phone required" });
  req.customerPhone = phone;
  next();
}

// ─── POST /api/customer/complaints ─────────────────────────────────────────────
router.post("/complaints", async (req, res) => {
  try {
    const { company_id, customer_name, customer_phone, customer_email, type, subject, description, lr_number, shipment_id } = req.body;
    if (!company_id || !customer_name || !customer_phone || !subject || !description) {
      return res.status(400).json({ error: "company_id, customer_name, customer_phone, subject and description are required" });
    }

    const ai = await classifyComplaint({ subject, description, type: type || "General Feedback", lr_number, companyId: company_id });
    const dupId = await detectDuplicate({ companyId: company_id, customerPhone: customer_phone, description, lr_number });
    const { sla_response_deadline, sla_resolution_deadline } = computeSLADeadlines(ai.priority);

    const ticket = await Complaint.create({
      company_id, ticket_number: genTicketNumber(),
      customer_name, customer_phone, customer_email,
      type: type || ai.category, subject, description, lr_number, shipment_id,
      priority: ai.priority, department: ai.department,
      ai_category: ai.category, ai_priority: ai.priority, ai_sentiment: ai.sentiment, ai_sentiment_score: ai.sentiment_score,
      ai_department: ai.department, ai_root_cause: ai.root_cause, ai_suggested_resolution: ai.suggested_resolution,
      ai_auto_reply_draft: ai.auto_reply_draft, ai_confidence: ai.confidence, ai_flags: ai.flags,
      ai_escalation_recommended: ai.escalation_recommended,
      is_duplicate: !!dupId, duplicate_of: dupId || undefined,
      source: "web", status: "New",
      sla_response_deadline, sla_resolution_deadline,
      created_by: null,
    });

    await logActivity(company_id, ticket._id, { actor_role: "customer", actor_name: customer_name, action: "created", comment: "Complaint raised via customer portal" });
    await logActivity(company_id, ticket._id, { actor_role: "ai", actor_name: "AI Classifier", action: "ai_classified", comment: `AI: category=${ai.category}, priority=${ai.priority}, sentiment=${ai.sentiment}` });
    await ComplaintSentiment.create({ company_id, complaint_id: ticket._id, state: sentimentToState(ai.sentiment), score: ai.sentiment_score, source: "initial", message_excerpt: description.slice(0, 200) });

    res.status(201).json({
      ticket: { ticket_number: ticket.ticket_number, status: ticket.status, priority: ticket.priority },
      is_duplicate: !!dupId,
      ai_auto_reply: ai.auto_reply_draft,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

function sentimentToState(sentiment) {
  return { very_negative: "Very Angry", negative: "Angry", neutral: "Neutral", positive: "Satisfied" }[sentiment] || "Neutral";
}

// ─── GET /api/customer/complaints?customer_phone=...&company_id=... ───────────
router.get("/complaints", requirePhone, async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: "company_id required" });
    const complaints = await Complaint.find({ company_id, customer_phone: req.customerPhone })
      .select("ticket_number subject type status priority createdAt resolved_at satisfaction_rating")
      .sort("-createdAt").lean();
    res.json({ complaints });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/customer/complaints/:id?customer_phone=... ──────────────────────
router.get("/complaints/:id", requirePhone, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, customer_phone: req.customerPhone }).lean();
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    const [activities, attachments, feedback] = await Promise.all([
      ComplaintActivity.find({ complaint_id: complaint._id, is_internal: false }).sort("createdAt").lean(),
      ComplaintAttachment.find({ complaint_id: complaint._id }).sort("-createdAt").lean(),
      ComplaintFeedback.findOne({ complaint_id: complaint._id }).lean(),
    ]);

    res.json({ ...complaint, sla_status: getSLAStatus(complaint), activities, attachments, feedback });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/customer/complaints/:id/reply ───────────────────────────────────
router.post("/complaints/:id/reply", requirePhone, async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment) return res.status(400).json({ error: "comment required" });
    const complaint = await Complaint.findOne({ _id: req.params.id, customer_phone: req.customerPhone });
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    const activity = await ComplaintActivity.create({
      company_id: complaint.company_id, complaint_id: complaint._id,
      actor_name: complaint.customer_name, actor_role: "customer", action: "comment_added", comment,
    });

    if (complaint.status === "Waiting For Customer") { complaint.status = "In Progress"; await complaint.save(); }

    res.status(201).json(activity);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/customer/complaints/:id/upload ──────────────────────────────────
router.post("/complaints/:id/upload", requirePhone, async (req, res) => {
  try {
    const { file_name, file_url, file_type, file_size_kb, category = "document" } = req.body;
    if (!file_name || !file_url) return res.status(400).json({ error: "file_name and file_url required" });
    const complaint = await Complaint.findOne({ _id: req.params.id, customer_phone: req.customerPhone });
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    const v = validateAttachment({ file_name, mime_type: file_type, file_size_kb });
    const dup = v.content_hash ? await ComplaintAttachmentValidation.findOne({ company_id: complaint.company_id, complaint_id: complaint._id, content_hash: v.content_hash }) : null;

    await ComplaintAttachmentValidation.create({
      company_id: complaint.company_id, complaint_id: complaint._id,
      original_name: file_name, safe_name: v.safe_name, mime_type: file_type, file_size_kb,
      category: v.category, content_hash: v.content_hash, is_duplicate: !!dup, duplicate_of: dup?.attachment_id,
      valid: v.valid, errors: v.errors, virus_scan_status: v.virus_scan_status, uploaded_by_type: "customer",
    });

    if (!v.valid) return res.status(400).json({ error: "Attachment failed validation", details: v.errors });

    const attachment = await ComplaintAttachment.create({
      company_id: complaint.company_id, complaint_id: complaint._id,
      uploader_name: complaint.customer_name, uploader_role: "customer",
      file_name: v.safe_name, file_url, file_type, file_size_kb, category,
    });
    await logActivity(complaint.company_id, complaint._id, { actor_name: complaint.customer_name, actor_role: "customer", action: "attachment_added", comment: `Attachment: ${v.safe_name}` });
    res.status(201).json(attachment);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/customer/complaints/:id/rating ──────────────────────────────────
router.post("/complaints/:id/rating", requirePhone, async (req, res) => {
  try {
    const { rating, comment, response_speed_rating, resolution_quality_rating, agent_courtesy_rating, would_recommend } = req.body;
    if (!rating) return res.status(400).json({ error: "rating required" });
    const complaint = await Complaint.findOne({ _id: req.params.id, customer_phone: req.customerPhone });
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    if (!["Resolved", "Closed"].includes(complaint.status)) return res.status(400).json({ error: "Feedback only allowed once complaint is resolved" });

    const feedback = await ComplaintFeedback.create({
      company_id: complaint.company_id, complaint_id: complaint._id,
      customer_name: complaint.customer_name, customer_phone: complaint.customer_phone,
      rating, comment, response_speed_rating, resolution_quality_rating, agent_courtesy_rating, would_recommend,
      feedback_sentiment: rating >= 4 ? "positive" : rating <= 2 ? "negative" : "neutral",
      submitted_via: "customer_portal",
    });

    complaint.satisfaction_rating = rating;
    complaint.satisfaction_comment = comment;
    complaint.feedback_at = new Date();
    if (complaint.status === "Resolved") complaint.status = "Closed";
    await complaint.save();

    await ComplaintSentiment.create({
      company_id: complaint.company_id, complaint_id: complaint._id,
      state: rating >= 5 ? "Very Happy" : rating === 4 ? "Satisfied" : rating === 3 ? "Neutral" : rating === 2 ? "Angry" : "Very Angry",
      score: (rating - 3) / 2, source: "feedback", message_excerpt: comment?.slice(0, 200),
    });

    res.status(201).json(feedback);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/customer/complaints/:id/reopen ──────────────────────────────────
router.post("/complaints/:id/reopen", requirePhone, async (req, res) => {
  try {
    const { reason } = req.body;
    const complaint = await Complaint.findOne({ _id: req.params.id, customer_phone: req.customerPhone });
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    if (!["Resolved", "Closed"].includes(complaint.status)) return res.status(400).json({ error: "Only resolved/closed complaints can be reopened" });

    complaint.status = "Open";
    complaint.reopened_at = new Date();
    complaint.reopen_count = (complaint.reopen_count || 0) + 1;
    await complaint.save();

    await logActivity(complaint.company_id, complaint._id, { actor_name: complaint.customer_name, actor_role: "customer", action: "reopened", comment: reason || "Reopened by customer" });
    res.json(complaint);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/customer/timeline?customer_phone=...&company_id=... ─────────────
router.get("/timeline", requirePhone, async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: "company_id required" });

    const customer = await Customer.findOne({ company_id, phone: req.customerPhone }).lean();

    const [shipments, quotes, complaints] = await Promise.all([
      Shipment.find({ company_id, $or: [{ customer_phone: req.customerPhone }, customer ? { customer_id: customer._id } : {} ] }).sort("-createdAt").limit(20).lean().catch(() => []),
      Quote.find({ company_id, $or: [{ customer_phone: req.customerPhone }, customer ? { customer_id: customer._id } : {} ] }).sort("-createdAt").limit(20).lean().catch(() => []),
      Complaint.find({ company_id, customer_phone: req.customerPhone }).sort("-createdAt").limit(20).lean(),
    ]);

    res.json({
      customer: customer || { name: complaints[0]?.customer_name, phone: req.customerPhone },
      shipment_history:  shipments,
      quotation_history:  quotes,
      complaint_history:  complaints,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/customer/satisfaction?customer_phone=...&company_id=... ─────────
router.get("/satisfaction", requirePhone, async (req, res) => {
  try {
    const { company_id } = req.query;
    const feedbacks = await ComplaintFeedback.find({ company_id, customer_phone: req.customerPhone }).sort("-createdAt").lean();
    const avg = feedbacks.length ? feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length : null;
    res.json({ feedbacks, average_rating: avg ? Math.round(avg * 10) / 10 : null, total_surveys: feedbacks.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
