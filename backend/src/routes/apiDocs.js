const express = require('express');
const router  = express.Router();
const { authenticate: auth } = require('../middleware/auth');

const ok = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });

const API_CATALOG = [
  // Phase 1-5
  { module:'Customer Support',   base:'/api/live-agent',      version:'v1', endpoints:[{m:'GET',p:'/queue'},{m:'POST',p:'/'},{m:'GET',p:'/sessions'}] },
  { module:'Shipments',          base:'/api/shipments',        version:'v1', endpoints:[{m:'GET',p:'/'},{m:'POST',p:'/'},{m:'GET',p:'/:id'}] },
  { module:'Tracking',           base:'/api/tracking',         version:'v1', endpoints:[{m:'GET',p:'/dispatcher'},{m:'GET',p:'/search'}] },
  { module:'Quotes',             base:'/api/quotes',           version:'v1', endpoints:[{m:'GET',p:'/'},{m:'POST',p:'/'},{m:'GET',p:'/:id'}] },
  { module:'Fleet',              base:'/api/fleet',            version:'v1', endpoints:[{m:'GET',p:'/'},{m:'GET',p:'/analytics'},{m:'POST',p:'/'}] },
  // Phase 6-10
  { module:'Dispatch',           base:'/api/dispatch',         version:'v1', endpoints:[{m:'GET',p:'/plans'},{m:'GET',p:'/queue'},{m:'GET',p:'/analytics'}] },
  { module:'Complaints',         base:'/api/complaints',       version:'v1', endpoints:[{m:'GET',p:'/'},{m:'POST',p:'/'},{m:'GET',p:'/dashboard'}] },
  { module:'Voice AI',           base:'/api/voice',            version:'v1', endpoints:[{m:'GET',p:'/history'},{m:'GET',p:'/analytics'},{m:'POST',p:'/'}] },
  { module:'CRM Leads',          base:'/api/leads',            version:'v1', endpoints:[{m:'GET',p:'/'},{m:'POST',p:'/'},{m:'PUT',p:'/:id'}] },
  { module:'Drivers',            base:'/api/drivers',          version:'v1', endpoints:[{m:'GET',p:'/'},{m:'GET',p:'/:id'}] },
  // Phase 11-15
  { module:'Documents',          base:'/api/documents',        version:'v1', endpoints:[{m:'GET',p:'/'},{m:'POST',p:'/'},{m:'GET',p:'/:id'}] },
  { module:'Business Intelligence',base:'/api/executive',      version:'v1', endpoints:[{m:'GET',p:'/summary'},{m:'GET',p:'/kpis'}] },
  { module:'Maintenance AI',     base:'/api/maintenance-ai',   version:'v1', endpoints:[{m:'GET',p:'/dashboard'},{m:'GET',p:'/predictions'}] },
  { module:'Inventory',          base:'/api/inventory',        version:'v1', endpoints:[{m:'GET',p:'/'},{m:'POST',p:'/'},{m:'PUT',p:'/:id'}] },
  { module:'Control Tower',      base:'/api/control-tower',    version:'v1', endpoints:[{m:'GET',p:'/events'},{m:'POST',p:'/events'}] },
  { module:'Purchase Orders',    base:'/api/purchase-orders',  version:'v1', endpoints:[{m:'GET',p:'/'},{m:'POST',p:'/'},{m:'GET',p:'/:id'}] },
  // Phase 16
  { module:'Automation',         base:'/api/automation',       version:'v1', endpoints:[{m:'GET',p:'/'},{m:'POST',p:'/'},{m:'POST',p:'/ai-build'}] },
  { module:'Approvals',          base:'/api/approvals',        version:'v1', endpoints:[{m:'GET',p:'/requests'},{m:'POST',p:'/requests'},{m:'POST',p:'/requests/:id/approve'}] },
  { module:'Digital Workers',    base:'/api/digital-workers',  version:'v1', endpoints:[{m:'GET',p:'/'},{m:'POST',p:'/'},{m:'POST',p:'/:id/activate'}] },
  { module:'Scheduler',          base:'/api/scheduler',        version:'v1', endpoints:[{m:'GET',p:'/'},{m:'POST',p:'/'},{m:'POST',p:'/:id/run-now'}] },
  // Phase 17
  { module:'API Gateway',        base:'/api/gateway',          version:'v1', endpoints:[{m:'GET',p:'/'},{m:'POST',p:'/'},{m:'GET',p:'/stats/overview'}] },
  { module:'Webhooks',           base:'/api/webhooks',         version:'v1', endpoints:[{m:'GET',p:'/'},{m:'POST',p:'/'},{m:'POST',p:'/:id/test'}] },
  { module:'API Keys',           base:'/api/api-keys',         version:'v1', endpoints:[{m:'GET',p:'/'},{m:'POST',p:'/'},{m:'POST',p:'/:id/rotate'}] },
  { module:'Connectors',         base:'/api/connectors',       version:'v1', endpoints:[{m:'GET',p:'/'},{m:'POST',p:'/'},{m:'GET',p:'/catalog'}] },
  { module:'Event Bus',          base:'/api/events',           version:'v1', endpoints:[{m:'GET',p:'/'},{m:'POST',p:'/'},{m:'GET',p:'/stats'}] },
  { module:'OAuth',              base:'/api/oauth',            version:'v1', endpoints:[{m:'POST',p:'/token'},{m:'GET',p:'/tokens'},{m:'GET',p:'/scopes'}] },
  { module:'Sync Engine',        base:'/api/sync',             version:'v1', endpoints:[{m:'GET',p:'/jobs'},{m:'POST',p:'/jobs'},{m:'GET',p:'/stats'}] },
];

// GET /api/api-docs
router.get('/', auth, async (_req, res) => {
  return ok(res, {
    title: 'Local Wheels Enterprise API',
    version: '17.0.0',
    base_url: '/api',
    authentication: 'Bearer JWT Token (Authorization: Bearer <token>)',
    total_modules: API_CATALOG.length,
    modules: API_CATALOG,
  });
});

// GET /api/api-docs/openapi
router.get('/openapi', auth, async (_req, res) => {
  const spec = {
    openapi: '3.0.0',
    info: { title: 'Local Wheels Enterprise API', version: '17.0.0', description: 'AI Logistics Platform REST API' },
    servers: [{ url: '/api', description: 'Local Wheels API v1' }],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    },
    paths: {},
    tags: API_CATALOG.map(m => ({ name: m.module })),
  };
  return res.json(spec);
});

// GET /api/api-docs/modules/:module
router.get('/modules/:module', auth, async (req, res) => {
  const mod = API_CATALOG.find(m => m.module.toLowerCase().replace(/\s+/g,'-') === req.params.module.toLowerCase());
  if (!mod) return res.status(404).json({ status: false, message: 'Module not found' });
  return ok(res, mod);
});

module.exports = router;
