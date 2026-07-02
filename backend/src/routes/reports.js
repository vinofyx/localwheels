const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Anthropic = require('@anthropic-ai/sdk');
const Shipment = require('../models/Shipment');
const Complaint = require('../models/Complaint');
const Document = require('../models/Document');
const ExecutiveReport = require('../models/ExecutiveReport');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function buildReportData(company_id, report_type, period_from, period_to) {
  const from = period_from ? new Date(period_from) : new Date(new Date().setDate(1));
  const to = period_to ? new Date(period_to) : new Date();

  const [shipments, delivered, complaints, docs] = await Promise.all([
    Shipment.countDocuments({ company_id, createdAt: { $gte: from, $lte: to } }).catch(() => 0),
    Shipment.countDocuments({ company_id, status: 'delivered', createdAt: { $gte: from, $lte: to } }).catch(() => 0),
    Complaint.countDocuments({ company_id, createdAt: { $gte: from, $lte: to } }).catch(() => 0),
    Document.countDocuments({ company_id, createdAt: { $gte: from, $lte: to } }).catch(() => 0),
  ]);

  const revenueAgg = await Shipment.aggregate([
    { $match: { company_id, createdAt: { $gte: from, $lte: to } } },
    { $group: { _id: null, total: { $sum: '$freight_charges' } } },
  ]).catch(() => []);

  const revenue = revenueAgg[0]?.total || 0;
  const deliveryRate = shipments > 0 ? ((delivered / shipments) * 100).toFixed(1) : 0;

  return { shipments, delivered, deliveryRate, complaints, docs, revenue, period_from: from, period_to: to };
}

// GET /api/reports — list reports
router.get('/', auth, async (req, res) => {
  try {
    const { report_type, limit = 20, page = 1 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (report_type) filter.report_type = report_type;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [reports, total] = await Promise.all([
      ExecutiveReport.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .populate('generated_by', 'name'),
      ExecutiveReport.countDocuments(filter),
    ]);
    res.json({ reports, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports/generate — generate a report
router.post('/generate', auth, async (req, res) => {
  try {
    const { report_type = 'executive', period_from, period_to, title } = req.body;

    const report = await ExecutiveReport.create({
      company_id: req.user.company_id,
      report_type,
      title: title || `${report_type.charAt(0).toUpperCase() + report_type.slice(1)} Report — ${new Date().toLocaleDateString()}`,
      period_from: period_from ? new Date(period_from) : undefined,
      period_to: period_to ? new Date(period_to) : undefined,
      status: 'generating',
      generated_by: req.user._id,
      format: 'json',
    });

    res.json({ report, message: 'Report generation started' });

    setImmediate(async () => {
      try {
        const data = await buildReportData(req.user.company_id, report_type, period_from, period_to);

        const sections = [
          { title: 'Executive Summary', content: `Period: ${data.period_from.toLocaleDateString()} — ${data.period_to.toLocaleDateString()}`, data },
          { title: 'Revenue', content: `Total Revenue: ₹${data.revenue.toLocaleString()}`, data: { revenue: data.revenue } },
          { title: 'Shipments', content: `Total: ${data.shipments} | Delivered: ${data.delivered} | Delivery Rate: ${data.deliveryRate}%`, data: { shipments: data.shipments, delivered: data.delivered, deliveryRate: data.deliveryRate } },
          { title: 'Complaints', content: `Total complaints raised: ${data.complaints}`, data: { complaints: data.complaints } },
          { title: 'Documents', content: `Documents processed: ${data.docs}`, data: { docs: data.docs } },
        ];

        let aiSummary = '';
        try {
          const msg = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 400,
            messages: [{
              role: 'user',
              content: `Write a 3-sentence executive summary for a logistics company report. Data: Revenue ₹${data.revenue.toLocaleString()}, ${data.shipments} shipments, ${data.deliveryRate}% delivery rate, ${data.complaints} complaints. Be professional and highlight key insights.`,
            }],
          });
          aiSummary = msg.content[0]?.text || '';
        } catch (_) {
          aiSummary = `Revenue of ₹${data.revenue.toLocaleString()} was recorded for the period with ${data.shipments} shipments processed at a ${data.deliveryRate}% delivery rate. ${data.complaints} customer complaints were received. Overall operations appear ${parseFloat(data.deliveryRate) > 80 ? 'healthy' : 'requiring attention'}.`;
        }

        await ExecutiveReport.updateOne({ _id: report._id }, { sections, ai_summary: aiSummary, status: 'ready' });
      } catch (err) {
        await ExecutiveReport.updateOne({ _id: report._id }, { status: 'failed' });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/:id — get report
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await ExecutiveReport.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('generated_by', 'name email');
    if (!report) return res.status(404).json({ error: 'Report not found' });
    await ExecutiveReport.updateOne({ _id: report._id }, { $inc: { download_count: 1 } });
    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/:id/export — export as JSON (CSV/PDF stubs)
router.get('/:id/export', auth, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const report = await ExecutiveReport.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!report) return res.status(404).json({ error: 'Report not found' });

    if (format === 'csv') {
      const lines = [`Report: ${report.title}`, `Generated: ${report.createdAt.toISOString()}`, ''];
      report.sections?.forEach(s => {
        lines.push(`## ${s.title}`);
        lines.push(s.content || '');
        lines.push('');
      });
      if (report.ai_summary) lines.push(`AI Summary: ${report.ai_summary}`);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report-${report._id}.csv"`);
      return res.send(lines.join('\n'));
    }

    res.json({ report, format });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reports/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await ExecutiveReport.deleteOne({ _id: req.params.id, company_id: req.user.company_id });
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
