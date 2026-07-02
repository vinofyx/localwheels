const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');
const Shipment = require('../models/Shipment');
const Complaint = require('../models/Complaint');
const Document = require('../models/Document');
const BusinessInsight = require('../models/BusinessInsight');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function gatherBusinessContext(company_id) {
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const prevMonth = new Date(monthStart); prevMonth.setMonth(prevMonth.getMonth() - 1);

  const [
    shipmentsThisMonth,
    shipmentsPrevMonth,
    deliveredThisMonth,
    complaintsOpen,
    docsProcessed,
    revenueAgg,
    prevRevenueAgg,
  ] = await Promise.all([
    Shipment.countDocuments({ company_id, createdAt: { $gte: monthStart } }).catch(() => 0),
    Shipment.countDocuments({ company_id, createdAt: { $gte: prevMonth, $lt: monthStart } }).catch(() => 0),
    Shipment.countDocuments({ company_id, status: 'delivered', createdAt: { $gte: monthStart } }).catch(() => 0),
    Complaint.countDocuments({ company_id, status: { $in: ['open','in_progress'] } }).catch(() => 0),
    Document.countDocuments({ company_id, createdAt: { $gte: monthStart } }).catch(() => 0),
    Shipment.aggregate([{ $match: { company_id, createdAt: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$freight_charges' } } }]).catch(() => []),
    Shipment.aggregate([{ $match: { company_id, createdAt: { $gte: prevMonth, $lt: monthStart } } }, { $group: { _id: null, total: { $sum: '$freight_charges' } } }]).catch(() => []),
  ]);

  const rev = revenueAgg[0]?.total || 0;
  const prevRev = prevRevenueAgg[0]?.total || 0;
  const revChange = prevRev > 0 ? (((rev - prevRev) / prevRev) * 100).toFixed(1) : 0;
  const deliveryRate = shipmentsThisMonth > 0 ? ((deliveredThisMonth / shipmentsThisMonth) * 100).toFixed(1) : 0;

  return {
    shipmentsThisMonth, shipmentsPrevMonth,
    deliveredThisMonth, deliveryRate,
    complaintsOpen, docsProcessed,
    revenueThisMonth: rev, revenuePrevMonth: prevRev, revChange,
  };
}

// POST /api/business-intelligence/query — natural language BI query
router.post('/query', auth, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'question is required' });

    const ctx = await gatherBusinessContext(req.user.company_id);

    let answer = '';
    let data = null;

    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: `You are an AI business intelligence assistant for a logistics company called Local Wheels.

Current business data:
- Shipments this month: ${ctx.shipmentsThisMonth} (prev: ${ctx.shipmentsPrevMonth})
- Delivered this month: ${ctx.deliveredThisMonth} (${ctx.deliveryRate}% rate)
- Revenue this month: ₹${ctx.revenueThisMonth.toLocaleString()} (${ctx.revChange}% vs last month)
- Open complaints: ${ctx.complaintsOpen}
- Documents processed: ${ctx.docsProcessed}

User question: "${question}"

Answer concisely and helpfully. Include specific numbers. If you can make a recommendation, include it.
Format: {"answer": "...", "recommendation": "...", "metrics": {"key": value}}`
        }],
      });
      const txt = msg.content[0]?.text || '';
      const jm = txt.match(/\{[\s\S]*\}/);
      if (jm) {
        const parsed = JSON.parse(jm[0]);
        answer = parsed.answer || txt;
        data = parsed;
      } else {
        answer = txt;
      }
    } catch (_) {
      answer = `Based on current data: ${ctx.shipmentsThisMonth} shipments this month with ${ctx.deliveryRate}% delivery rate. Revenue ₹${ctx.revenueThisMonth.toLocaleString()} (${ctx.revChange}% vs last month). ${ctx.complaintsOpen} open complaints.`;
    }

    res.json({ answer, data, context: ctx, question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/business-intelligence/insights — list AI insights
router.get('/insights', auth, async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (type) filter.insight_type = type;
    const insights = await BusinessInsight.find(filter).sort({ createdAt: -1 }).limit(parseInt(limit));
    res.json({ insights });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/business-intelligence/generate-insights — AI generates fresh insights
router.post('/generate-insights', auth, async (req, res) => {
  try {
    const ctx = await gatherBusinessContext(req.user.company_id);
    const insights = [];

    // Rule-based insights first (no AI call needed, instant)
    if (parseFloat(ctx.revChange) < -10) {
      insights.push({
        company_id: req.user.company_id,
        insight_type: 'revenue',
        title: 'Revenue Decline Detected',
        summary: `Revenue dropped ${Math.abs(ctx.revChange)}% vs last month`,
        severity: 'critical',
        recommendation: 'Review pricing and customer retention. Investigate top churned customers.',
        source_modules: ['shipments'],
        generated_by: 'rules',
      });
    }
    if (ctx.complaintsOpen > 20) {
      insights.push({
        company_id: req.user.company_id,
        insight_type: 'complaint',
        title: 'High Open Complaint Volume',
        summary: `${ctx.complaintsOpen} complaints currently open`,
        severity: 'warning',
        recommendation: 'Prioritize complaint resolution. Check SLA compliance.',
        source_modules: ['complaints'],
        generated_by: 'rules',
      });
    }
    if (parseFloat(ctx.deliveryRate) < 80) {
      insights.push({
        company_id: req.user.company_id,
        insight_type: 'operations',
        title: 'Low Delivery Rate',
        summary: `Only ${ctx.deliveryRate}% of shipments delivered on time`,
        severity: 'warning',
        recommendation: 'Review dispatch scheduling and route optimization.',
        source_modules: ['shipments'],
        generated_by: 'rules',
      });
    }

    // AI-generated insight
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Logistics business data: shipments=${ctx.shipmentsThisMonth}, revenue=₹${ctx.revenueThisMonth}, rev_change=${ctx.revChange}%, delivery_rate=${ctx.deliveryRate}%, open_complaints=${ctx.complaintsOpen}. Generate ONE actionable business insight. JSON: {"title":"...","summary":"...","recommendation":"...","type":"revenue|operations|customer|fleet"}`,
        }],
      });
      const txt = msg.content[0]?.text || '';
      const jm = txt.match(/\{[\s\S]*\}/);
      if (jm) {
        const ai = JSON.parse(jm[0]);
        insights.push({
          company_id: req.user.company_id,
          insight_type: ai.type || 'operations',
          title: ai.title,
          summary: ai.summary,
          recommendation: ai.recommendation,
          severity: 'info',
          source_modules: ['ai'],
          generated_by: 'ai',
        });
      }
    } catch (_) { /* non-blocking */ }

    if (insights.length > 0) {
      await BusinessInsight.insertMany(insights);
    }

    res.json({ insights, generated: insights.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/business-intelligence/recommendations — actionable recommendations
router.get('/recommendations', auth, async (req, res) => {
  try {
    const ctx = await gatherBusinessContext(req.user.company_id);
    const recs = [];

    if (ctx.shipmentsThisMonth < ctx.shipmentsPrevMonth * 0.9) {
      recs.push({ priority: 'high', action: 'Shipment volume down 10%+. Review sales pipeline and quote conversion rates.', module: 'sales' });
    }
    if (ctx.complaintsOpen > 10) {
      recs.push({ priority: 'medium', action: `${ctx.complaintsOpen} open complaints. Assign agents and review SLA breaches.`, module: 'complaints' });
    }
    if (parseFloat(ctx.revChange) > 10) {
      recs.push({ priority: 'low', action: `Revenue up ${ctx.revChange}%. Consider capacity expansion to meet demand.`, module: 'fleet' });
    }
    recs.push({ priority: 'low', action: 'Schedule weekly executive review of BI dashboard KPIs.', module: 'executive' });

    res.json({ recommendations: recs, context: ctx });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/business-intelligence/insights/:id/read — mark read
router.post('/insights/:id/read', auth, async (req, res) => {
  try {
    await BusinessInsight.updateOne({ _id: req.params.id, company_id: req.user.company_id }, { is_read: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
