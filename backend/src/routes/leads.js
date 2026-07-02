const express = require('express');
const router  = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');
const Lead         = require('../models/Lead');
const Opportunity  = require('../models/Opportunity');
const SalesActivity= require('../models/SalesActivity');
const SalesTask    = require('../models/SalesTask');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── helpers ──────────────────────────────────────────────────────────────────
async function genLeadNumber(companyId) {
  const d   = new Date();
  const pfx = `LD-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const last = await Lead.findOne({ company_id: companyId, lead_number: new RegExp(`^${pfx}`) })
    .sort({ lead_number: -1 }).lean();
  const seq = last ? (parseInt(last.lead_number.split('-')[2]) || 0) + 1 : 1;
  return `${pfx}-${String(seq).padStart(4,'0')}`;
}

async function logActivity(companyId, leadId, type, description, userId, meta = {}) {
  await SalesActivity.create({ company_id: companyId, lead_id: leadId, type, description, metadata: meta, performed_by: userId });
}

async function aiScoreLead(lead) {
  try {
    const prompt = `You are a logistics CRM assistant. Score this freight lead 0-100 and qualify it.

Lead:
- Name: ${lead.name}
- Company: ${lead.company_name || 'N/A'}
- Source: ${lead.source}
- Route: ${lead.origin_city || 'N/A'} → ${lead.destination_city || 'N/A'}
- Cargo: ${lead.cargo_type || 'N/A'}, ${lead.weight_tons || '?'} tons
- Frequency: ${lead.frequency}
- Service: ${lead.service_type}
- Estimated Value: ₹${lead.estimated_value || 0}

Reply with JSON only:
{
  "score": 0-100,
  "qualification": "one sentence why",
  "next_action": "specific next step",
  "win_probability": 0-100,
  "sentiment": "positive|neutral|negative"
}`;

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0].text.trim();
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
    return {
      ai_score:           Math.min(100, Math.max(0, Number(json.score) || 0)),
      ai_qualification:   json.qualification || '',
      ai_next_action:     json.next_action || '',
      ai_win_probability: Math.min(100, Math.max(0, Number(json.win_probability) || 0)),
      ai_sentiment:       ['positive','neutral','negative'].includes(json.sentiment) ? json.sentiment : 'neutral',
    };
  } catch {
    // rule-based fallback
    let score = 20;
    if (lead.estimated_value > 100000) score += 25;
    else if (lead.estimated_value > 50000) score += 15;
    if (lead.phone)  score += 10;
    if (lead.email)  score += 10;
    if (lead.company_name) score += 10;
    if (['referral','sales_team'].includes(lead.source)) score += 15;
    if (lead.frequency !== 'one_time') score += 10;
    return {
      ai_score:           Math.min(100, score),
      ai_qualification:   score >= 60 ? 'High-value prospect with good conversion potential' : 'Moderate prospect, needs more qualification',
      ai_next_action:     'Call and understand exact requirements',
      ai_win_probability: Math.round(score * 0.8),
      ai_sentiment:       'neutral',
    };
  }
}

// ── GET /api/leads/dashboard ──────────────────────────────────────────────────
router.get('/dashboard', auth, async (req, res) => {
  try {
    const cid   = req.user.company_id;
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);

    const [
      totalLeads, todayLeads, qualifiedLeads, wonLeads, lostLeads,
      pendingFollowups, byStage, bySource, recentLeads,
    ] = await Promise.all([
      Lead.countDocuments({ company_id: cid }),
      Lead.countDocuments({ company_id: cid, createdAt: { $gte: today, $lt: tomorrow } }),
      Lead.countDocuments({ company_id: cid, stage: { $in: ['qualified','contacted','meeting_scheduled','proposal_sent','negotiation'] } }),
      Lead.countDocuments({ company_id: cid, stage: 'won' }),
      Lead.countDocuments({ company_id: cid, stage: 'lost' }),
      Lead.countDocuments({ company_id: cid, next_followup_at: { $lte: tomorrow }, stage: { $nin: ['won','lost'] } }),
      Lead.aggregate([{ $match: { company_id: cid } }, { $group: { _id: '$stage', count: { $sum: 1 } } }]),
      Lead.aggregate([{ $match: { company_id: cid } }, { $group: { _id: '$source', count: { $sum: 1 } } }]),
      Lead.find({ company_id: cid }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

    const pipelineAgg = await Lead.aggregate([
      { $match: { company_id: cid, stage: { $nin: ['won','lost'] } } },
      { $group: { _id: null, total: { $sum: '$estimated_value' }, weighted: { $sum: { $multiply: ['$estimated_value', { $divide: ['$probability', 100] }] } } } },
    ]);
    const pipeline = pipelineAgg[0] || { total: 0, weighted: 0 };

    res.json({
      kpis: { totalLeads, todayLeads, qualifiedLeads, wonLeads, lostLeads, pendingFollowups, conversionRate },
      pipeline: { total: Math.round(pipeline.total), weighted: Math.round(pipeline.weighted) },
      byStage:  Object.fromEntries(byStage.map(s => [s._id, s.count])),
      bySource: Object.fromEntries(bySource.map(s => [s._id, s.count])),
      recentLeads,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/leads ────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { stage, source, assigned_to, search, page = 1, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id };
    if (stage)       q.stage = stage;
    if (source)      q.source = source;
    if (assigned_to) q.assigned_to = assigned_to;
    if (search)      q.$or = [
      { name: new RegExp(search, 'i') },
      { company_name: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
    ];

    const skip  = (Number(page) - 1) * Number(limit);
    const [leads, total] = await Promise.all([
      Lead.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
        .populate('assigned_to', 'full_name username').lean(),
      Lead.countDocuments(q),
    ]);
    res.json({ leads, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/leads ───────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const lead_number = await genLeadNumber(req.user.company_id);
    const aiData      = await aiScoreLead(req.body);

    const lead = await Lead.create({
      ...req.body,
      lead_number,
      company_id: req.user.company_id,
      branch_id:  req.user.branch_id,
      created_by: req.user._id,
      ...aiData,
    });

    await logActivity(req.user.company_id, lead._id, 'created', `Lead ${lead_number} created`, req.user._id);
    if (aiData.ai_next_action) {
      await SalesTask.create({
        company_id: req.user.company_id, lead_id: lead._id,
        title: aiData.ai_next_action, type: 'follow_up', priority: 'medium',
        due_date: new Date(Date.now() + 24*60*60*1000),
        assigned_to: lead.assigned_to || req.user._id,
        created_by: req.user._id, ai_suggested: true, ai_reason: 'Auto-created from AI scoring',
      });
    }

    res.status(201).json(lead);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/leads/:id ────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('assigned_to', 'full_name username').lean();
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const [activities, tasks, meetings] = await Promise.all([
      SalesActivity.find({ lead_id: lead._id }).sort({ createdAt: -1 }).limit(20)
        .populate('performed_by', 'full_name').lean(),
      SalesTask.find({ lead_id: lead._id, status: { $ne: 'cancelled' } }).sort({ due_date: 1 }).lean(),
      require('../models/CustomerMeeting').find({ lead_id: lead._id }).sort({ scheduled_at: -1 }).limit(5).lean(),
    ]);

    res.json({ lead, activities, tasks, meetings });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/leads/:id ────────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const existing = await Lead.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!existing) return res.status(404).json({ error: 'Lead not found' });

    const prevStage = existing.stage;
    const updates   = { ...req.body };

    if (updates.stage === 'won' && prevStage !== 'won') updates.won_date = new Date();
    if (updates.stage === 'lost' && prevStage !== 'lost') updates.lost_date = new Date();

    const lead = await Lead.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (updates.stage && updates.stage !== prevStage) {
      await logActivity(req.user.company_id, lead._id, 'stage_change',
        `Stage changed: ${prevStage} → ${updates.stage}`, req.user._id);
    } else {
      await logActivity(req.user.company_id, lead._id, 'note', 'Lead updated', req.user._id);
    }

    res.json(lead);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/leads/:id ─────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, company_id: req.user.company_id });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/leads/score ─────────────────────────────────────────────────────
router.post('/score', auth, async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.body.lead_id, company_id: req.user.company_id });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const aiData = await aiScoreLead(lead);
    await Lead.findByIdAndUpdate(lead._id, aiData);
    await logActivity(req.user.company_id, lead._id, 'score_update',
      `AI score updated to ${aiData.ai_score}`, req.user._id, aiData);
    res.json({ ...aiData, lead_id: lead._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/leads/qualify ───────────────────────────────────────────────────
router.post('/qualify', auth, async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.body.lead_id, company_id: req.user.company_id });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const aiData = await aiScoreLead(lead);
    const newStage = aiData.ai_score >= 60 ? 'qualified' : lead.stage;

    await Lead.findByIdAndUpdate(lead._id, { ...aiData, stage: newStage });
    await logActivity(req.user.company_id, lead._id, 'stage_change',
      `Lead qualified by AI. Score: ${aiData.ai_score}`, req.user._id);

    res.json({ qualified: aiData.ai_score >= 60, stage: newStage, ...aiData });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
