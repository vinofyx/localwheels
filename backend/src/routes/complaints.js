const express  = require("express");
const router   = express.Router();
const mongoose = require("mongoose");
const { authenticate: auth } = require("../middleware/auth");
const { log: auditLog }      = require("../utils/audit");
const { genTicketNumber, computeSLADeadlines, classifyComplaint, detectDuplicate, getSuggestedReply } = require("../utils/complaintClassifier");
const { checkSLABreaches, getSLAStatus, getSLADashboard } = require("../utils/slaEngine");
const Complaint           = require("../models/Complaint");
const ComplaintActivity   = require("../models/ComplaintActivity");
const ComplaintAssignment = require("../models/ComplaintAssignment");
const ComplaintResolution = require("../models/ComplaintResolution");
const ComplaintFeedback   = require("../models/ComplaintFeedback");
const ComplaintAttachment = require("../models/ComplaintAttachment");
const ComplaintAttachmentValidation = require("../models/ComplaintAttachmentValidation");
const ComplaintSentiment  = require("../models/ComplaintSentiment");
const { validateAttachment } = require("../utils/attachmentValidator");

async function logActivity(companyId, complaintId, data) {
  await ComplaintActivity.create({ company_id: companyId, complaint_id: complaintId, ...data });
}

// POST /api/complaints
router.post("/", auth, async (req, res) => {
  try {
    const { customer_name, customer_phone, customer_email, customer_id, type, subject, description, lr_number, shipment_id, source = "web", tags } = req.body;
    if (!customer_name || !type || !subject || !description) return res.status(400).json({ error: "customer_name, type, subject, description required" });
    const companyId = req.user.company_id;
    const ai  = await classifyComplaint({ subject, description, type, lr_number, companyId });
    const dupId = await detectDuplicate({ companyId, customerPhone: customer_phone, description, lr_number });
    const priority = ai.priority || "Medium";
    const sla = computeSLADeadlines(priority);
    const ticket = await Complaint.create({
      company_id: companyId, branch_id: req.user.branch_id, ticket_number: genTicketNumber(),
      customer_id, customer_name, customer_phone, customer_email,
      type: ai.category || type, status: "New", priority, subject, description, lr_number, shipment_id, source, tags,
      department: ai.department, ai_category: ai.category, ai_priority: ai.priority,
      ai_sentiment: ai.sentiment, ai_sentiment_score: ai.sentiment_score, ai_department: ai.department,
      ai_root_cause: ai.root_cause, ai_suggested_resolution: ai.suggested_resolution,
      ai_auto_reply_draft: ai.auto_reply_draft, ai_confidence: ai.confidence,
      ai_flags: ai.flags || [], ai_escalation_recommended: ai.escalation_recommended || false,
      is_duplicate: !!dupId, duplicate_of: dupId || undefined, ...sla, created_by: req.user._id,
    });
    await logActivity(companyId, ticket._id, { actor_id: req.user._id, actor_name: req.user.name, actor_role: "agent", action: "created", comment: `Complaint registered: ${subject}` });
    await logActivity(companyId, ticket._id, { actor_role: "ai", actor_name: "AI Classifier", action: "ai_classified", comment: `AI: category=${ai.category}, priority=${ai.priority}, sentiment=${ai.sentiment}, confidence=${ai.confidence}%` });
    await auditLog({ company_id: companyId, user: req.user, action: "complaint_created", resource: "Complaint", resource_id: ticket._id });
    res.status(201).json({ ticket, ai_classification: ai, is_duplicate: !!dupId, duplicate_of: dupId });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// GET /api/complaints/dashboard
router.get("/dashboard", auth, async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const oid = new mongoose.Types.ObjectId(companyId);
    const [slaDash, statusCounts, priorityCounts, sentimentCounts, avgResAgg, recentCritical] = await Promise.all([
      getSLADashboard(companyId),
      Complaint.aggregate([{ $match: { company_id: oid } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $match: { company_id: oid, status: { $nin: ["Resolved","Closed"] } } }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $match: { company_id: oid, createdAt: { $gte: new Date(Date.now()-7*86400000) } } }, { $group: { _id: "$ai_sentiment", count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $match: { company_id: oid, status: "Resolved", resolution_time_min: { $gt: 0 } } }, { $group: { _id: null, avg: { $avg: "$resolution_time_min" } } }]),
      Complaint.find({ company_id: companyId, priority: "Critical", status: { $nin: ["Resolved","Closed","Rejected"] } }).sort("-createdAt").limit(5).lean(),
    ]);
    res.json({ sla: slaDash, status_counts: statusCounts.reduce((a,c)=>{a[c._id]=c.count;return a;},{}), priority_counts: priorityCounts.reduce((a,c)=>{a[c._id]=c.count;return a;},{}), sentiment_counts: sentimentCounts.reduce((a,c)=>{a[c._id]=c.count;return a;},{}), avg_resolution_min: Math.round(avgResAgg[0]?.avg||0), recent_critical: recentCritical });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/complaints/analytics
router.get("/analytics", auth, async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 86400000);
    const oid = new mongoose.Types.ObjectId(companyId);
    const [volumeAgg, byType, byDept, resAgg, csatAgg, dailyVol, agentAgg] = await Promise.all([
      Complaint.aggregate([{ $match: { company_id: oid, createdAt: { $gte: since } } }, { $group: { _id: null, total: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ["$status","Resolved"] }, 1, 0] } }, closed: { $sum: { $cond: [{ $eq: ["$status","Closed"] }, 1, 0] } }, escalated: { $sum: { $cond: [{ $eq: ["$status","Escalated"] }, 1, 0] } }, sla_breached: { $sum: { $cond: ["$is_sla_resolution_breached", 1, 0] } }, critical: { $sum: { $cond: [{ $eq: ["$priority","Critical"] }, 1, 0] } }, duplicates: { $sum: { $cond: ["$is_duplicate", 1, 0] } } } }]),
      Complaint.aggregate([{ $match: { company_id: oid, createdAt: { $gte: since } } }, { $group: { _id: "$type", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Complaint.aggregate([{ $match: { company_id: oid, createdAt: { $gte: since } } }, { $group: { _id: "$department", count: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ["$status","Resolved"] }, 1, 0] } }, avg_resolution: { $avg: "$resolution_time_min" } } }, { $sort: { count: -1 } }]),
      Complaint.aggregate([{ $match: { company_id: oid, status: "Resolved", resolution_time_min: { $gt: 0 }, createdAt: { $gte: since } } }, { $group: { _id: "$priority", avg_min: { $avg: "$resolution_time_min" }, count: { $sum: 1 } } }]),
      ComplaintFeedback.aggregate([{ $match: { company_id: oid, createdAt: { $gte: since } } }, { $group: { _id: null, avg_rating: { $avg: "$rating" }, count: { $sum: 1 }, promoters: { $sum: { $cond: [{ $gte: ["$rating",4] }, 1, 0] } }, detractors: { $sum: { $cond: [{ $lte: ["$rating",2] }, 1, 0] } } } }]),
      Complaint.aggregate([{ $match: { company_id: oid, createdAt: { $gte: new Date(Date.now()-7*86400000) } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Complaint.aggregate([{ $match: { company_id: oid, createdAt: { $gte: since }, assigned_to: { $ne: null } } }, { $group: { _id: "$assigned_to", agent_name: { $first: "$assigned_name" }, tickets: { $sum: 1 }, resolved: { $sum: { $cond: [{ $eq: ["$status","Resolved"] }, 1, 0] } }, avg_resolution: { $avg: "$resolution_time_min" } } }, { $sort: { tickets: -1 } }, { $limit: 10 }]),
    ]);
    const vol = volumeAgg[0]||{}; const csat = csatAgg[0]||{};
    const sla_compliance_pct = vol.total>0 ? Math.round(((vol.total-(vol.sla_breached||0))/vol.total)*100) : 100;
    const resolution_rate = vol.total>0 ? Math.round(((vol.resolved+vol.closed)/vol.total)*100) : 0;
    res.json({ period_days: Number(days), volume: { ...vol, sla_compliance_pct, resolution_rate }, by_type: byType, by_department: byDept, resolution_by_priority: resAgg, csat: { avg_rating: Math.round((csat.avg_rating||0)*10)/10, count: csat.count||0, promoters: csat.promoters||0, detractors: csat.detractors||0, nps: csat.count>0 ? Math.round(((csat.promoters-csat.detractors)/csat.count)*100) : 0 }, daily_volume: dailyVol, agent_performance: agentAgg });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/complaints
router.get("/", auth, async (req, res) => {
  try {
    const { status, priority, type, department, assigned_to, search, page=1, limit=30, sort="-createdAt" } = req.query;
    const filter = { company_id: req.user.company_id };
    if (status) filter.status=status; if (priority) filter.priority=priority; if (type) filter.type=type;
    if (department) filter.department=department; if (assigned_to) filter.assigned_to=assigned_to;
    if (search) { const re=new RegExp(search,"i"); filter.$or=[{ticket_number:re},{subject:re},{customer_name:re},{lr_number:re}]; }
    const [items,total] = await Promise.all([
      Complaint.find(filter).sort(sort).skip((page-1)*limit).limit(Number(limit)).populate("assigned_to","name email").lean(),
      Complaint.countDocuments(filter),
    ]);
    res.json({ items: items.map(c=>({...c,sla_status:getSLAStatus(c)})), total, page:Number(page), pages:Math.ceil(total/limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/complaints/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, company_id: req.user.company_id }).populate("assigned_to","name email role").populate("shipment_id","lr_number status origin destination").lean();
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    const [activities,attachments,resolution,feedback] = await Promise.all([
      ComplaintActivity.find({ complaint_id: complaint._id }).sort({createdAt:1}).lean(),
      ComplaintAttachment.find({ complaint_id: complaint._id }).lean(),
      ComplaintResolution.findOne({ complaint_id: complaint._id }).lean(),
      ComplaintFeedback.findOne({ complaint_id: complaint._id }).lean(),
    ]);
    res.json({ ...complaint, sla_status: getSLAStatus(complaint), activities, attachments, resolution, feedback });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/complaints/:id
router.put("/:id", auth, async (req, res) => {
  try {
    const { status, priority, department, subject, description, tags } = req.body;
    const complaint = await Complaint.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    const changes=[];
    if (status&&status!==complaint.status)             { changes.push({field:"status",from:complaint.status,to:status});         complaint.status=status; }
    if (priority&&priority!==complaint.priority)       { changes.push({field:"priority",from:complaint.priority,to:priority});   complaint.priority=priority; }
    if (department&&department!==complaint.department) { changes.push({field:"department",from:complaint.department,to:department}); complaint.department=department; }
    if (subject) complaint.subject=subject; if (description) complaint.description=description; if (tags) complaint.tags=tags;
    await complaint.save();
    for (const ch of changes) await logActivity(req.user.company_id, complaint._id, { actor_id:req.user._id, actor_name:req.user.name, actor_role:"agent", action:ch.field==="status"?"status_changed":`${ch.field}_changed`, field_changed:ch.field, from_value:ch.from, to_value:ch.to, comment:`${ch.field} changed from ${ch.from} to ${ch.to}` });
    res.json(complaint);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/complaints/:id/assign
router.post("/:id/assign", auth, async (req, res) => {
  try {
    const { assigned_to, assigned_name, department, reason, is_ai_assigned=false } = req.body;
    if (!assigned_to) return res.status(400).json({ error: "assigned_to required" });
    const complaint = await Complaint.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    const wasAssigned=complaint.assigned_to;
    complaint.assigned_to=assigned_to; complaint.assigned_name=assigned_name; complaint.assigned_at=new Date();
    if (complaint.status==="New") complaint.status="Assigned";
    if (department) complaint.department=department;
    await complaint.save();
    await ComplaintAssignment.create({ company_id:req.user.company_id, complaint_id:complaint._id, assigned_to, assigned_name, department, reason, assigned_by:req.user._id, is_ai_assigned });
    await logActivity(req.user.company_id, complaint._id, { actor_id:req.user._id, actor_name:req.user.name, actor_role:"agent", action:wasAssigned?"reassigned":"assigned", to_value:assigned_name, comment:`Assigned to ${assigned_name}${reason?` - ${reason}`:""}` });
    res.json({ success:true, complaint });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/complaints/:id/escalate
router.post("/:id/escalate", auth, async (req, res) => {
  try {
    const { escalated_to, reason } = req.body;
    const complaint = await Complaint.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    complaint.status="Escalated"; complaint.escalated_to=escalated_to; complaint.escalated_at=new Date();
    complaint.escalation_reason=reason; complaint.sla_escalated=true; complaint.sla_escalated_at=new Date();
    await complaint.save();
    await logActivity(req.user.company_id, complaint._id, { actor_id:req.user._id, actor_name:req.user.name, actor_role:"agent", action:"escalated", comment:`Escalated: ${reason||"No reason given"}` });
    res.json({ success:true, complaint });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/complaints/:id/resolve
router.post("/:id/resolve", auth, async (req, res) => {
  try {
    const { resolution_action, resolution_type="other", root_cause, compensation_offered=false, compensation_amount, compensation_type, notes, knowledge_article_id } = req.body;
    if (!resolution_action) return res.status(400).json({ error: "resolution_action required" });
    const complaint = await Complaint.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    const now=new Date(); const resMin=Math.round((now-complaint.createdAt)/60000);
    complaint.status="Resolved"; complaint.resolved_at=now; complaint.resolution_summary=resolution_action;
    complaint.resolution_time_min=resMin; complaint.resolved_by=req.user._id;
    if (!complaint.first_response_at) complaint.first_response_at=now;
    await complaint.save();
    await ComplaintResolution.create({ company_id:req.user.company_id, complaint_id:complaint._id, resolved_by:req.user._id, resolver_name:req.user.name, department:complaint.department, root_cause, resolution_action, resolution_type, compensation_offered, compensation_amount, compensation_type, ai_suggested:!!complaint.ai_suggested_resolution, ai_suggestion:complaint.ai_suggested_resolution, knowledge_article_id, notes });
    await logActivity(req.user.company_id, complaint._id, { actor_id:req.user._id, actor_name:req.user.name, actor_role:"agent", action:"resolved", comment:`Resolved in ${Math.round(resMin/60)}h ${resMin%60}m - ${resolution_action}` });
    res.json({ success:true, complaint, resolution_time_min:resMin });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/complaints/:id/reopen
router.post("/:id/reopen", auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const complaint = await Complaint.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    complaint.status="Open"; complaint.reopened_at=new Date(); complaint.reopen_count=(complaint.reopen_count||0)+1; complaint.resolved_at=undefined;
    await complaint.save();
    await logActivity(req.user.company_id, complaint._id, { actor_id:req.user._id, actor_name:req.user.name, actor_role:"agent", action:"reopened", comment:reason||"Reopened" });
    res.json({ success:true, complaint });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/complaints/:id/comment
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { comment, is_internal=false } = req.body;
    if (!comment) return res.status(400).json({ error: "comment required" });
    const complaint = await Complaint.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    if (!complaint.first_response_at && !is_internal) {
      complaint.first_response_at=new Date();
      if (["New","Assigned"].includes(complaint.status)) complaint.status="In Progress";
      await complaint.save();
    }
    const activity = await ComplaintActivity.create({ company_id:req.user.company_id, complaint_id:complaint._id, actor_id:req.user._id, actor_name:req.user.name, actor_role:"agent", action:is_internal?"internal_note":"comment_added", is_internal, comment });
    res.status(201).json(activity);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/complaints/:id/upload
router.post("/:id/upload", auth, async (req, res) => {
  try {
    const { file_name, file_url, file_type, file_size_kb, category="document", description } = req.body;
    if (!file_name||!file_url) return res.status(400).json({ error: "file_name and file_url required" });
    const complaint = await Complaint.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    const v = validateAttachment({ file_name, mime_type: file_type, file_size_kb });
    const dup = v.content_hash ? await ComplaintAttachmentValidation.findOne({ company_id: req.user.company_id, complaint_id: complaint._id, content_hash: v.content_hash }) : null;

    await ComplaintAttachmentValidation.create({
      company_id: req.user.company_id, complaint_id: complaint._id,
      original_name: file_name, safe_name: v.safe_name, mime_type: file_type, file_size_kb,
      category: v.category, content_hash: v.content_hash, is_duplicate: !!dup, duplicate_of: dup?.attachment_id,
      valid: v.valid, errors: v.errors, virus_scan_status: v.virus_scan_status, uploaded_by_type: "agent",
    });

    if (!v.valid) return res.status(400).json({ error: "Attachment failed validation", details: v.errors });

    const attachment = await ComplaintAttachment.create({ company_id:req.user.company_id, complaint_id:complaint._id, uploaded_by:req.user._id, uploader_name:req.user.name, uploader_role:"agent", file_name:v.safe_name, file_url, file_type, file_size_kb, category, description });
    await logActivity(req.user.company_id, complaint._id, { actor_id:req.user._id, actor_name:req.user.name, actor_role:"agent", action:"attachment_added", comment:`Attachment: ${v.safe_name}` });
    res.status(201).json(attachment);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/complaints/:id/feedback  (public - no auth needed for customer survey)
router.post("/:id/feedback", async (req, res) => {
  try {
    const { rating, comment, response_speed_rating, resolution_quality_rating, agent_courtesy_rating, would_recommend } = req.body;
    if (!rating) return res.status(400).json({ error: "rating required" });
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    if (!["Resolved","Closed"].includes(complaint.status)) return res.status(400).json({ error: "Feedback only for resolved complaints" });
    const feedback = await ComplaintFeedback.create({ company_id:complaint.company_id, complaint_id:complaint._id, customer_name:complaint.customer_name, customer_phone:complaint.customer_phone, rating, comment, response_speed_rating, resolution_quality_rating, agent_courtesy_rating, would_recommend, feedback_sentiment:rating>=4?"positive":rating<=2?"negative":"neutral" });
    complaint.satisfaction_rating=rating; complaint.satisfaction_comment=comment; complaint.feedback_at=new Date();
    if (complaint.status==="Resolved") complaint.status="Closed";
    await complaint.save();
    res.status(201).json(feedback);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/complaints/:id/suggest-reply
router.post("/:id/suggest-reply", auth, async (req, res) => {
  try {
    const { context } = req.body;
    const complaint = await Complaint.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    const reply = await getSuggestedReply({ complaint, context });
    res.json({ suggested_reply: reply });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/complaints/sla/check
router.post("/sla/check", auth, async (req, res) => {
  try {
    const result = await checkSLABreaches(req.user.company_id);
    res.json({ success: true, ...result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
