const express = require('express');
const router  = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Opportunity  = require('../models/Opportunity');
const Lead         = require('../models/Lead');
const SalesActivity= require('../models/SalesActivity');

async function genOppNumber(companyId) {
  const d   = new Date();
  const pfx = `OPP-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`;
  const last = await Opportunity.findOne({ company_id: companyId, opp_number: new RegExp(`^${pfx}`) })
    .sort({ opp_number: -1 }).lean();
  const seq = last ? (parseInt(last.opp_number.split('-')[2]) || 0) + 1 : 1;
  return `${pfx}-${String(seq).padStart(4,'0')}`;
}

// ── GET /api/opportunities/pipeline ──────────────────────────────────────────
router.get('/pipeline', auth, async (req, res) => {
  try {
    const opps = await Opportunity.find({ company_id: req.user.company_id, stage: { $nin: ['won','lost'] } })
      .populate('assigned_to', 'full_name').sort({ updatedAt: -1 }).lean();

    const stages = ['new_lead','qualified','contacted','meeting_scheduled','proposal_sent','negotiation'];
    const pipeline = {};
    for (const s of stages) pipeline[s] = { opportunities: [], total_value: 0, count: 0 };

    for (const o of opps) {
      if (pipeline[o.stage]) {
        pipeline[o.stage].opportunities.push(o);
        pipeline[o.stage].total_value += o.estimated_value || 0;
        pipeline[o.stage].count++;
      }
    }
    res.json(pipeline);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/opportunities ────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { stage, assigned_to, search, page = 1, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id };
    if (stage)       q.stage = stage;
    if (assigned_to) q.assigned_to = assigned_to;
    if (search)      q.$or = [
      { title: new RegExp(search, 'i') },
      { customer_name: new RegExp(search, 'i') },
      { company_name: new RegExp(search, 'i') },
    ];

    const skip  = (Number(page) - 1) * Number(limit);
    const [opps, total] = await Promise.all([
      Opportunity.find(q).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit))
        .populate('assigned_to', 'full_name username').lean(),
      Opportunity.countDocuments(q),
    ]);
    res.json({ opportunities: opps, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/opportunities ───────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const opp_number = await genOppNumber(req.user.company_id);
    const opp = await Opportunity.create({
      ...req.body,
      opp_number,
      company_id: req.user.company_id,
      branch_id:  req.user.branch_id,
      created_by: req.user._id,
    });
    await SalesActivity.create({
      company_id: req.user.company_id, opportunity_id: opp._id,
      type: 'created', description: `Opportunity ${opp_number} created`,
      performed_by: req.user._id,
    });
    res.status(201).json(opp);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/opportunities/:id ────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const existing = await Opportunity.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!existing) return res.status(404).json({ error: 'Opportunity not found' });

    const updates = { ...req.body };
    if (updates.stage === 'won' && existing.stage !== 'won') updates.actual_close_date = new Date();

    const opp = await Opportunity.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (updates.stage && updates.stage !== existing.stage) {
      await SalesActivity.create({
        company_id: req.user.company_id, opportunity_id: opp._id,
        type: 'stage_change', description: `Stage: ${existing.stage} → ${updates.stage}`,
        performed_by: req.user._id,
      });
    }
    res.json(opp);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /api/opportunities/:id ─────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const opp = await Opportunity.findOneAndDelete({ _id: req.params.id, company_id: req.user.company_id });
    if (!opp) return res.status(404).json({ error: 'Opportunity not found' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/opportunities/convert ──────────────────────────────────────────
// Convert a lead to an opportunity
router.post('/convert', auth, async (req, res) => {
  try {
    const { lead_id } = req.body;
    const lead = await Lead.findOne({ _id: lead_id, company_id: req.user.company_id });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const opp_number = await genOppNumber(req.user.company_id);
    const opp = await Opportunity.create({
      company_id:     req.user.company_id,
      branch_id:      req.user.branch_id,
      lead_id:        lead._id,
      opp_number,
      title:          `${lead.company_name || lead.name} — ${lead.service_type?.toUpperCase() || 'FTL'}`,
      customer_name:  lead.name,
      company_name:   lead.company_name,
      email:          lead.email,
      phone:          lead.phone,
      stage:          'qualified',
      estimated_value:lead.estimated_value,
      probability:    lead.ai_win_probability || lead.probability || 30,
      service_type:   lead.service_type,
      origin:         lead.origin_city,
      destination:    lead.destination_city,
      cargo_type:     lead.cargo_type,
      weight_tons:    lead.weight_tons,
      frequency:      lead.frequency,
      ai_score:       lead.ai_score,
      ai_win_probability: lead.ai_win_probability,
      ai_next_action: lead.ai_next_action,
      assigned_to:    lead.assigned_to,
      created_by:     req.user._id,
    });

    await Lead.findByIdAndUpdate(lead._id, { stage: 'qualified', converted_to_opportunity: opp._id });
    await SalesActivity.create({
      company_id: req.user.company_id, lead_id: lead._id, opportunity_id: opp._id,
      type: 'stage_change', description: `Lead converted to Opportunity ${opp_number}`,
      performed_by: req.user._id,
    });

    res.status(201).json({ opportunity: opp });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
