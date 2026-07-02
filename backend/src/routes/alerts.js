const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const ExecutiveAlert = require('../models/ExecutiveAlert');
const Shipment = require('../models/Shipment');
const Complaint = require('../models/Complaint');
const Document = require('../models/Document');

async function generateAlerts(company_id) {
  const alerts = [];
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonth = new Date(monthStart); prevMonth.setMonth(prevMonth.getMonth() - 1);

  // Delayed shipments alert
  const delayed = await Shipment.countDocuments({ company_id, status: { $in: ['in_transit','dispatched'] }, expected_delivery: { $lt: now } }).catch(() => 0);
  if (delayed > 5) {
    alerts.push({ alert_type: 'delayed_shipments', severity: delayed > 20 ? 'critical' : 'warning', title: 'Delayed Shipments', message: `${delayed} shipments past expected delivery date`, metric_name: 'delayed_shipments', metric_value: delayed, threshold: 5, source_module: 'shipments', action_url: '/shipments?status=in_transit' });
  }

  // Open complaint SLA
  const slaBreached = await Complaint.countDocuments({ company_id, status: { $in: ['open','in_progress'] }, createdAt: { $lt: new Date(now - 48 * 3600000) } }).catch(() => 0);
  if (slaBreached > 0) {
    alerts.push({ alert_type: 'complaint_sla_breach', severity: 'critical', title: 'SLA Breach — Complaints', message: `${slaBreached} complaints open for more than 48 hours`, metric_name: 'sla_breached', metric_value: slaBreached, threshold: 0, source_module: 'complaints', action_url: '/complaints/center' });
  }

  // Document expiry
  const expiringDocs = await Document.countDocuments({ company_id, is_deleted: false, expiry_date: { $gte: now, $lte: new Date(now.getTime() + 30 * 86400000) } }).catch(() => 0);
  if (expiringDocs > 0) {
    alerts.push({ alert_type: 'document_expiry', severity: 'warning', title: 'Documents Expiring Soon', message: `${expiringDocs} documents expiring within 30 days`, metric_name: 'expiring_docs', metric_value: expiringDocs, threshold: 0, source_module: 'documents', action_url: '/documents/search' });
  }

  // Revenue comparison
  const [curRev, prevRev] = await Promise.all([
    Shipment.aggregate([{ $match: { company_id, createdAt: { $gte: monthStart } } }, { $group: { _id: null, t: { $sum: '$freight_charges' } } }]).catch(() => []),
    Shipment.aggregate([{ $match: { company_id, createdAt: { $gte: prevMonth, $lt: monthStart } } }, { $group: { _id: null, t: { $sum: '$freight_charges' } } }]).catch(() => []),
  ]);
  const cur = curRev[0]?.t || 0;
  const prev = prevRev[0]?.t || 0;
  if (prev > 0 && cur < prev * 0.8) {
    const drop = (((prev - cur) / prev) * 100).toFixed(0);
    alerts.push({ alert_type: 'revenue_drop', severity: 'critical', title: 'Revenue Drop Alert', message: `Revenue down ${drop}% vs last month`, metric_name: 'revenue_change_pct', metric_value: -parseFloat(drop), threshold: -20, source_module: 'shipments', action_url: '/bi/financial' });
  }

  // Fraud risk docs
  const fraudDocs = await Document.countDocuments({ company_id, fraud_risk: 'high', is_deleted: false }).catch(() => 0);
  if (fraudDocs > 0) {
    alerts.push({ alert_type: 'fraud_risk', severity: 'critical', title: 'High Fraud Risk Documents', message: `${fraudDocs} documents flagged as high fraud risk`, metric_name: 'fraud_docs', metric_value: fraudDocs, threshold: 0, source_module: 'documents', action_url: '/documents/validation' });
  }

  return alerts;
}

// GET /api/alerts — list active alerts
router.get('/', auth, async (req, res) => {
  try {
    const { severity, is_resolved = 'false', limit = 20, page = 1 } = req.query;
    const filter = { company_id: req.user.company_id };
    if (severity) filter.severity = severity;
    filter.is_resolved = is_resolved === 'true';
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [alerts, total] = await Promise.all([
      ExecutiveAlert.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      ExecutiveAlert.countDocuments(filter),
    ]);
    res.json({ alerts, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts/scan — trigger alert scan
router.post('/scan', auth, async (req, res) => {
  try {
    const newAlerts = await generateAlerts(req.user.company_id);
    let created = 0;
    for (const a of newAlerts) {
      const exists = await ExecutiveAlert.findOne({ company_id: req.user.company_id, alert_type: a.alert_type, is_resolved: false, createdAt: { $gte: new Date(Date.now() - 86400000) } });
      if (!exists) {
        await ExecutiveAlert.create({ ...a, company_id: req.user.company_id });
        created++;
      }
    }
    res.json({ scanned: newAlerts.length, created, message: `${created} new alert(s) created` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/stats — alert counts by severity
router.get('/stats', auth, async (req, res) => {
  try {
    const agg = await ExecutiveAlert.aggregate([
      { $match: { company_id: req.user.company_id, is_resolved: false } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);
    const stats = { critical: 0, warning: 0, info: 0, total: 0 };
    agg.forEach(a => { stats[a._id] = a.count; stats.total += a.count; });
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts/:id/resolve
router.post('/:id/resolve', auth, async (req, res) => {
  try {
    const alert = await ExecutiveAlert.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { is_resolved: true, resolved_by: req.user._id, resolved_at: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json({ alert, message: 'Alert resolved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts/:id/read
router.post('/:id/read', auth, async (req, res) => {
  try {
    await ExecutiveAlert.updateOne({ _id: req.params.id, company_id: req.user.company_id }, { is_read: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
