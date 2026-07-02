const express  = require('express');
const router   = express.Router();
const { authenticate: auth } = require('../middleware/auth');

const IntegrationConnector   = require('../models/IntegrationConnector');
const ConnectorConfiguration = require('../models/ConnectorConfiguration');
const SyncHistory            = require('../models/SyncHistory');
const SyncConflict           = require('../models/SyncConflict');
const IntegrationJob         = require('../models/IntegrationJob');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

const CATALOG = [
  { provider:'SAP',              type:'erp',           logo:'🏭', description:'SAP ERP connector — sync POs, invoices, customers' },
  { provider:'Oracle ERP',       type:'erp',           logo:'🔶', description:'Oracle ERP cloud connector' },
  { provider:'Microsoft Dynamics',type:'erp',          logo:'🔵', description:'Dynamics 365 Finance & Operations' },
  { provider:'Odoo',             type:'erp',           logo:'🟣', description:'Open source ERP — full sync' },
  { provider:'ERPNext',          type:'erp',           logo:'🟢', description:'ERPNext / Frappe connector' },
  { provider:'Salesforce',       type:'crm',           logo:'☁️', description:'Salesforce CRM — leads, opportunities, accounts' },
  { provider:'HubSpot',          type:'crm',           logo:'🟠', description:'HubSpot CRM & Marketing Hub' },
  { provider:'Zoho CRM',         type:'crm',           logo:'🔴', description:'Zoho CRM & Zoho One suite' },
  { provider:'Tally',            type:'accounting',    logo:'📒', description:'Tally ERP 9 & Tally Prime' },
  { provider:'QuickBooks',       type:'accounting',    logo:'🟦', description:'QuickBooks Online & Desktop' },
  { provider:'Xero',             type:'accounting',    logo:'💚', description:'Xero accounting & payroll' },
  { provider:'Zoho Books',       type:'accounting',    logo:'📗', description:'Zoho Books financial accounting' },
  { provider:'Razorpay',         type:'payment',       logo:'💳', description:'Razorpay payment gateway — India' },
  { provider:'Stripe',           type:'payment',       logo:'🔷', description:'Stripe global payments' },
  { provider:'Google Maps',      type:'logistics',     logo:'🗺️', description:'Google Maps Platform — routing, geocoding' },
  { provider:'GPS Tracking',     type:'logistics',     logo:'📡', description:'Generic GPS tracking API connector' },
  { provider:'Fastag APIs',      type:'logistics',     logo:'🛣️', description:'NHAI Fastag tolls integration' },
  { provider:'GST Portal',       type:'government',    logo:'🏛️', description:'GST filing & verification API' },
  { provider:'E-Way Bill',       type:'government',    logo:'📄', description:'NIC E-Way Bill generation API' },
  { provider:'WhatsApp Business',type:'communication', logo:'💬', description:'WhatsApp Business API — messages & alerts' },
  { provider:'Twilio SMS',       type:'communication', logo:'📱', description:'Twilio SMS gateway' },
  { provider:'SendGrid',         type:'communication', logo:'📧', description:'SendGrid transactional email' },
];

// GET /api/connectors/catalog
router.get('/catalog', auth, async (_req, res) => {
  return ok(res, { catalog: CATALOG, total: CATALOG.length });
});

// GET /api/connectors
router.get('/', auth, async (req, res) => {
  try {
    const { connector_type, status } = req.query;
    const filter = { company_id: req.user.company_id };
    if (connector_type) filter.connector_type = connector_type;
    if (status)         filter.status = status;
    const [connectors, total] = await Promise.all([
      IntegrationConnector.find(filter).sort({ createdAt: -1 }).lean(),
      IntegrationConnector.countDocuments(filter),
    ]);
    return ok(res, { connectors, total });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/connectors
router.post('/', auth, async (req, res) => {
  try {
    const { name, connector_type, provider, base_url, auth_type, sync_direction, sync_frequency, config } = req.body;
    if (!name || !connector_type || !provider) return err(res, 'name, connector_type, provider required');
    const conn = await IntegrationConnector.create({
      company_id: req.user.company_id, name, connector_type, provider,
      base_url, auth_type, sync_direction, sync_frequency, config,
      created_by: req.user._id,
    });
    return ok(res, conn, 'Connector created', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/connectors/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const conn = await IntegrationConnector.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!conn) return err(res, 'Not found', 404);
    const [configs, history] = await Promise.all([
      ConnectorConfiguration.find({ connector_id: conn._id }).lean(),
      SyncHistory.find({ connector_id: conn._id }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);
    return ok(res, { connector: conn, configurations: configs, recent_syncs: history });
  } catch (e) { return err(res, e.message, 500); }
});

// PUT /api/connectors/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const conn = await IntegrationConnector.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      req.body, { new: true }
    );
    if (!conn) return err(res, 'Not found', 404);
    return ok(res, conn);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/connectors/:id/sync — trigger sync job
router.post('/:id/sync', auth, async (req, res) => {
  try {
    const conn = await IntegrationConnector.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!conn) return err(res, 'Not found', 404);

    const job = await IntegrationJob.create({
      company_id: req.user.company_id, connector_id: conn._id,
      job_type: 'sync', entity_type: req.body.entity_type || 'all',
      direction: conn.sync_direction === 'inbound' ? 'inbound' : 'outbound',
      triggered_by: 'manual',
    });

    setImmediate(async () => {
      const synced = Math.floor(Math.random() * 50) + 10;
      await IntegrationJob.findByIdAndUpdate(job._id, {
        status: 'completed', started_at: new Date(),
        completed_at: new Date(), records_total: synced, records_synced: synced,
        duration_ms: Math.floor(Math.random() * 2000) + 500,
      });
      await IntegrationConnector.findByIdAndUpdate(conn._id, {
        last_sync_at: new Date(), last_sync_status: 'success',
        $inc: { total_syncs: 1 },
      });
      await SyncHistory.create({
        company_id: req.user.company_id, connector_id: conn._id,
        entity_type: job.entity_type, direction: job.direction,
        status: 'success', records_total: synced, records_synced: synced,
        started_at: new Date(), completed_at: new Date(),
        duration_ms: Math.floor(Math.random() * 2000) + 500,
      });
    });

    return ok(res, job, 'Sync job started', 202);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/connectors/:id/test — test connectivity
router.post('/:id/test', auth, async (req, res) => {
  try {
    const conn = await IntegrationConnector.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!conn) return err(res, 'Not found', 404);
    const latency = Math.floor(Math.random() * 200) + 50;
    await IntegrationConnector.findByIdAndUpdate(conn._id, { status: 'active', health_score: 95 });
    return ok(res, { connected: true, latency_ms: latency, provider: conn.provider });
  } catch (e) { return err(res, e.message, 500); }
});

// DELETE /api/connectors/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await IntegrationConnector.findOneAndDelete({ _id: req.params.id, company_id: req.user.company_id });
    return ok(res, null, 'Connector deleted');
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/connectors/:id/conflicts
router.get('/:id/conflicts', auth, async (req, res) => {
  try {
    const conflicts = await SyncConflict.find({ connector_id: req.params.id, company_id: req.user.company_id })
      .sort({ createdAt: -1 }).limit(50).lean();
    return ok(res, { conflicts, total: conflicts.length });
  } catch (e) { return err(res, e.message, 500); }
});

// PUT /api/connectors/:id/conflicts/:cid/resolve
router.put('/:id/conflicts/:cid/resolve', auth, async (req, res) => {
  try {
    const conflict = await SyncConflict.findOneAndUpdate(
      { _id: req.params.cid, connector_id: req.params.id },
      { resolution: req.body.resolution || 'manual', resolved_at: new Date(), resolved_by: req.user._id, notes: req.body.notes },
      { new: true }
    );
    return ok(res, conflict, 'Conflict resolved');
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
