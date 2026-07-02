const express    = require('express');
const router     = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Anthropic  = require('@anthropic-ai/sdk');
const Lead         = require('../models/Lead');
const Opportunity  = require('../models/Opportunity');
const CustomerMeeting = require('../models/CustomerMeeting');
const SalesActivity   = require('../models/SalesActivity');
const SalesTask       = require('../models/SalesTask');
const Proposal        = require('../models/Proposal');
const SalesForecast   = require('../models/SalesForecast');
const SalesTarget     = require('../models/SalesTarget');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── GET /api/sales/dashboard ──────────────────────────────────────────────────
router.get('/dashboard', auth, async (req, res) => {
  try {
    const cid   = req.user.company_id;
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayLeads, qualifiedLeads, pendingFollowups, meetingsToday,
      wonThisMonth, lostThisMonth,
      pipelineAgg, wonAgg,
      overdueTasks, upcomingMeetings, recentActivities,
    ] = await Promise.all([
      Lead.countDocuments({ company_id: cid, createdAt: { $gte: today, $lt: tomorrow } }),
      Lead.countDocuments({ company_id: cid, stage: 'qualified' }),
      SalesTask.countDocuments({ company_id: cid, status: 'pending', due_date: { $lte: tomorrow } }),
      CustomerMeeting.countDocuments({ company_id: cid, scheduled_at: { $gte: today, $lt: tomorrow }, status: 'scheduled' }),
      Opportunity.countDocuments({ company_id: cid, stage: 'won', actual_close_date: { $gte: monthStart } }),
      Opportunity.countDocuments({ company_id: cid, stage: 'lost', updatedAt: { $gte: monthStart } }),
      Opportunity.aggregate([
        { $match: { company_id: cid, stage: { $nin: ['won','lost'] } } },
        { $group: { _id: null, total: { $sum: '$estimated_value' }, weighted: { $sum: { $multiply: ['$estimated_value',{ $divide:['$probability',100] }] } } } },
      ]),
      Opportunity.aggregate([
        { $match: { company_id: cid, stage: 'won', actual_close_date: { $gte: monthStart } } },
        { $group: { _id: null, revenue: { $sum: '$estimated_value' } } },
      ]),
      SalesTask.find({ company_id: cid, status: 'pending', due_date: { $lt: today } })
        .sort({ due_date: 1 }).limit(5).lean(),
      CustomerMeeting.find({ company_id: cid, scheduled_at: { $gte: today }, status: 'scheduled' })
        .sort({ scheduled_at: 1 }).limit(5).lean(),
      SalesActivity.find({ company_id: cid }).sort({ createdAt: -1 }).limit(10)
        .populate('performed_by','full_name').lean(),
    ]);

    const pipeline = pipelineAgg[0] || { total: 0, weighted: 0 };
    const wonRevenue = wonAgg[0]?.revenue || 0;

    const target = await SalesTarget.findOne({ company_id: cid, period: 'monthly',
      period_date: { $gte: monthStart } }).lean();

    res.json({
      kpis: {
        todayLeads, qualifiedLeads, pendingFollowups, meetingsToday,
        wonThisMonth, lostThisMonth,
        pipelineTotal:    Math.round(pipeline.total),
        pipelineWeighted: Math.round(pipeline.weighted),
        wonRevenue,
      },
      target,
      overdueTasks,
      upcomingMeetings,
      recentActivities,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/sales/analytics ──────────────────────────────────────────────────
router.get('/analytics', auth, async (req, res) => {
  try {
    const cid  = req.user.company_id;
    const days = parseInt(req.query.days) || 30;
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      leadsByStage, leadsBySource, leadTrend,
      wonDeals, lostDeals, avgDealSize,
      activityBreakdown,
    ] = await Promise.all([
      Lead.aggregate([{ $match:{ company_id: cid } },{ $group:{ _id:'$stage', count:{ $sum:1 } } }]),
      Lead.aggregate([{ $match:{ company_id: cid } },{ $group:{ _id:'$source', count:{ $sum:1 } } }]),
      Lead.aggregate([
        { $match: { company_id: cid, createdAt: { $gte: from } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Opportunity.countDocuments({ company_id: cid, stage: 'won', updatedAt: { $gte: from } }),
      Opportunity.countDocuments({ company_id: cid, stage: 'lost', updatedAt: { $gte: from } }),
      Opportunity.aggregate([
        { $match: { company_id: cid, stage: 'won', updatedAt: { $gte: from } } },
        { $group: { _id: null, avg: { $avg: '$estimated_value' } } },
      ]),
      SalesActivity.aggregate([
        { $match: { company_id: cid, createdAt: { $gte: from } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);

    const totalLeads = await Lead.countDocuments({ company_id: cid, createdAt: { $gte: from } });
    const winRate = (wonDeals + lostDeals) > 0 ? Math.round(wonDeals / (wonDeals + lostDeals) * 100) : 0;

    res.json({
      summary: {
        totalLeads, wonDeals, lostDeals, winRate,
        avgDealSize: Math.round(avgDealSize[0]?.avg || 0),
      },
      leadsByStage:  Object.fromEntries(leadsByStage.map(s => [s._id, s.count])),
      leadsBySource: Object.fromEntries(leadsBySource.map(s => [s._id, s.count])),
      leadTrend,
      activityBreakdown: Object.fromEntries(activityBreakdown.map(a => [a._id, a.count])),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/sales/forecast ───────────────────────────────────────────────────
router.get('/forecast', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;

    // Compute current pipeline weighted forecast
    const pipelineAgg = await Opportunity.aggregate([
      { $match: { company_id: cid, stage: { $nin: ['won','lost'] } } },
      { $group: {
        _id: '$stage',
        total:    { $sum: '$estimated_value' },
        weighted: { $sum: { $multiply: ['$estimated_value', { $divide: ['$probability', 100] }] } },
        count:    { $sum: 1 },
      }},
    ]);

    const stageWeights = {
      new_lead: 0.05, qualified: 0.15, contacted: 0.25,
      meeting_scheduled: 0.40, proposal_sent: 0.60, negotiation: 0.80,
    };

    let pipelineTotal = 0, weightedTotal = 0;
    const byStage = {};
    for (const row of pipelineAgg) {
      pipelineTotal += row.total;
      weightedTotal += row.weighted;
      byStage[row._id] = { total: Math.round(row.total), weighted: Math.round(row.weighted), count: row.count };
    }

    // AI forecast narrative
    let aiForecast = Math.round(weightedTotal * 1.1);
    let aiNarrative = 'Based on current pipeline momentum, forecast is projected at 10% above weighted value.';
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Sales pipeline: total ₹${pipelineTotal}, weighted ₹${weightedTotal}, ${Object.keys(byStage).length} active stages.
Generate a brief 1-2 sentence revenue forecast insight for a logistics company. Be specific about the number.`,
        }],
      });
      aiNarrative = msg.content[0].text.trim();
    } catch {}

    const monthlyTarget = await SalesTarget.findOne({
      company_id: cid, period: 'monthly',
      period_date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    }).lean();

    res.json({
      pipeline_total:  Math.round(pipelineTotal),
      weighted_value:  Math.round(weightedTotal),
      ai_forecast:     aiForecast,
      ai_narrative:    aiNarrative,
      by_stage:        byStage,
      monthly_target:  monthlyTarget,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/sales/proposal ──────────────────────────────────────────────────
router.post('/proposal', auth, async (req, res) => {
  try {
    const { lead_id, opportunity_id, customer_name, company_name, requirements } = req.body;

    // Fetch context
    const [lead, opp] = await Promise.all([
      lead_id ? Lead.findById(lead_id).lean() : null,
      opportunity_id ? Opportunity.findById(opportunity_id).lean() : null,
    ]);

    const context = lead || opp || {};
    const prompt = `You are an expert logistics sales assistant. Generate a professional freight proposal.

Customer: ${customer_name || context.name || context.customer_name}
Company: ${company_name || context.company_name || 'N/A'}
Route: ${context.origin_city || context.origin || 'N/A'} → ${context.destination_city || context.destination || 'N/A'}
Service: ${context.service_type || 'FTL'}
Cargo: ${context.cargo_type || 'General Cargo'}, ${context.weight_tons || '?'} tons
Frequency: ${context.frequency || 'one_time'}
Estimated Value: ₹${context.estimated_value || 0}
Additional Requirements: ${requirements || 'Standard logistics service'}

Reply with JSON only:
{
  "executive_summary": "2-3 sentences",
  "services_offered": [{"name": "...", "description": "...", "price": 0}],
  "key_differentiators": ["...", "..."],
  "terms_conditions": "brief terms",
  "total_value": 0,
  "ai_confidence": 0-100
}`;

    let proposalContent = {
      executive_summary: `We are pleased to offer our freight logistics services for your ${context.service_type || 'FTL'} requirements.`,
      services_offered: [{ name: 'Freight Transport', description: 'Door-to-door logistics', price: context.estimated_value || 0 }],
      key_differentiators: ['GPS Tracking', 'On-time delivery', 'Experienced drivers', '24/7 support'],
      terms_conditions: 'Payment due within 30 days. Rates valid for 30 days.',
      total_value: context.estimated_value || 0,
      ai_confidence: 75,
    };

    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001', max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      });
      const parsed = JSON.parse(msg.content[0].text.match(/\{[\s\S]*\}/)[0]);
      proposalContent = { ...proposalContent, ...parsed };
    } catch {}

    const d = new Date();
    const proposal_number = `PROP-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${Math.random().toString(36).substr(2,4).toUpperCase()}`;

    const proposal = await Proposal.create({
      company_id:    req.user.company_id,
      lead_id,
      opportunity_id,
      proposal_number,
      title:         `Freight Proposal — ${customer_name || context.customer_name || 'Customer'}`,
      customer_name: customer_name || context.name || context.customer_name || '',
      company_name:  company_name || context.company_name || '',
      ai_generated:  true,
      created_by:    req.user._id,
      ...proposalContent,
    });

    if (lead_id) {
      await SalesActivity.create({
        company_id: req.user.company_id, lead_id,
        type: 'proposal_sent', description: `Proposal ${proposal_number} generated`,
        performed_by: req.user._id,
      });
    }

    res.status(201).json(proposal);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/sales/followup ──────────────────────────────────────────────────
router.post('/followup', auth, async (req, res) => {
  try {
    const { lead_id, opportunity_id, channel, notes } = req.body;
    const context = lead_id
      ? await Lead.findOne({ _id: lead_id, company_id: req.user.company_id }).lean()
      : await Opportunity.findOne({ _id: opportunity_id, company_id: req.user.company_id }).lean();
    if (!context) return res.status(404).json({ error: 'Lead/opportunity not found' });

    // AI generates message
    let aiMessage = `Hi ${context.name || context.customer_name}, following up on our freight discussion. Would you like to proceed?`;
    try {
      const prompt = `Write a short, professional ${channel || 'whatsapp'} follow-up message for a logistics sales rep to send to ${context.name || context.customer_name} at ${context.company_name || 'their company'}. Context: ${notes || 'general follow-up'}. Keep under 100 words.`;
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001', max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      });
      aiMessage = msg.content[0].text.trim();
    } catch {}

    const task = await SalesTask.create({
      company_id: req.user.company_id,
      lead_id, opportunity_id,
      title: `${channel || 'WhatsApp'} follow-up: ${context.name || context.customer_name}`,
      type: channel === 'email' ? 'email' : 'whatsapp',
      priority: 'medium', status: 'pending',
      due_date: new Date(Date.now() + 24*60*60*1000),
      assigned_to: req.user._id, created_by: req.user._id,
      ai_suggested: true, ai_reason: 'AI generated follow-up',
    });

    await SalesActivity.create({
      company_id: req.user.company_id, lead_id, opportunity_id,
      type: 'followup', description: `Follow-up scheduled via ${channel || 'whatsapp'}`,
      performed_by: req.user._id,
    });

    if (lead_id) await Lead.findByIdAndUpdate(lead_id, { next_followup_at: task.due_date });

    res.json({ task, ai_message: aiMessage });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/sales/meeting ───────────────────────────────────────────────────
router.post('/meeting', auth, async (req, res) => {
  try {
    const { lead_id, opportunity_id, title, meeting_type, scheduled_at, duration_min, agenda, attendees } = req.body;
    if (!scheduled_at) return res.status(400).json({ error: 'scheduled_at required' });

    const meeting = await CustomerMeeting.create({
      company_id: req.user.company_id,
      lead_id, opportunity_id, title, meeting_type,
      scheduled_at: new Date(scheduled_at), duration_min: duration_min || 30,
      agenda, attendees: attendees || [],
      created_by: req.user._id,
    });

    await SalesActivity.create({
      company_id: req.user.company_id, lead_id, opportunity_id,
      type: 'meeting', description: `Meeting scheduled: ${title} on ${new Date(scheduled_at).toLocaleDateString()}`,
      performed_by: req.user._id,
    });

    if (lead_id) {
      await Lead.findByIdAndUpdate(lead_id, { stage: 'meeting_scheduled', next_followup_at: new Date(scheduled_at) });
    }

    res.status(201).json(meeting);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/sales/meetings ───────────────────────────────────────────────────
router.get('/meetings', auth, async (req, res) => {
  try {
    const { status, from, to, page = 1, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id };
    if (status) q.status = status;
    if (from || to) {
      q.scheduled_at = {};
      if (from) q.scheduled_at.$gte = new Date(from);
      if (to)   q.scheduled_at.$lte = new Date(to);
    }
    const skip = (Number(page)-1) * Number(limit);
    const [meetings, total] = await Promise.all([
      CustomerMeeting.find(q).sort({ scheduled_at: 1 }).skip(skip).limit(Number(limit)).lean(),
      CustomerMeeting.countDocuments(q),
    ]);
    res.json({ meetings, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/sales/tasks ──────────────────────────────────────────────────────
router.get('/tasks', auth, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id, status };
    const skip = (Number(page)-1) * Number(limit);
    const [tasks, total] = await Promise.all([
      SalesTask.find(q).sort({ due_date: 1 }).skip(skip).limit(Number(limit))
        .populate('assigned_to','full_name').lean(),
      SalesTask.countDocuments(q),
    ]);
    res.json({ tasks, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/sales/tasks/:id ──────────────────────────────────────────────────
router.put('/tasks/:id', auth, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.status === 'completed') updates.completed_at = new Date();
    const task = await SalesTask.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      updates, { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/sales/proposals ──────────────────────────────────────────────────
router.get('/proposals', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id };
    if (status) q.status = status;
    const skip = (Number(page)-1)*Number(limit);
    const [proposals, total] = await Promise.all([
      Proposal.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Proposal.countDocuments(q),
    ]);
    res.json({ proposals, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/sales/copilot ───────────────────────────────────────────────────
// AI Sales Copilot — answer any sales question with context
router.post('/copilot', auth, async (req, res) => {
  try {
    const { message, lead_id, opportunity_id } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    const cid = req.user.company_id;

    const [lead, opp, recentLeads] = await Promise.all([
      lead_id ? Lead.findById(lead_id).lean() : null,
      opportunity_id ? Opportunity.findById(opportunity_id).lean() : null,
      Lead.find({ company_id: cid }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const context = `You are an AI Sales Copilot for LocalWheels, a freight logistics company.
Recent pipeline: ${recentLeads.length} leads, stages: ${[...new Set(recentLeads.map(l=>l.stage))].join(', ')}.
${lead ? `Current lead: ${lead.name} (${lead.company_name}), stage: ${lead.stage}, value: ₹${lead.estimated_value}, score: ${lead.ai_score}` : ''}
${opp  ? `Current opportunity: ${opp.title}, stage: ${opp.stage}, value: ₹${opp.estimated_value}, probability: ${opp.probability}%` : ''}

Answer sales questions, suggest strategies, generate messages, or help with logistics sales tasks.`;

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', max_tokens: 500,
      system: context,
      messages: [{ role: 'user', content: message }],
    });

    res.json({ reply: msg.content[0].text.trim() });
  } catch (err) {
    res.json({ reply: 'I can help with lead qualification, proposal writing, follow-up scripts, and sales strategy. What would you like assistance with?' });
  }
});

module.exports = router;
