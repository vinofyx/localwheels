const express  = require('express');
const router   = express.Router();
const { authenticate: auth } = require('../middleware/auth');

const ApiApplication = require('../models/ApiApplication');
const ApiKey         = require('../models/ApiKey');
const Webhook        = require('../models/Webhook');
const OAuthToken     = require('../models/OAuthToken');
const ApiAuditLog    = require('../models/ApiAuditLog');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// GET /api/developer-portal/overview — developer dashboard
router.get('/overview', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [apps, keys, webhooks, tokens, recentLogs] = await Promise.all([
      ApiApplication.countDocuments({ company_id: cid }),
      ApiKey.countDocuments({ company_id: cid, status: 'active' }),
      Webhook.countDocuments({ company_id: cid, status: 'active' }),
      OAuthToken.countDocuments({ company_id: cid, revoked: false, expires_at: { $gt: new Date() } }),
      ApiAuditLog.find({ company_id: cid }).sort({ logged_at: -1 }).limit(5).lean(),
    ]);
    return ok(res, {
      applications: apps, active_api_keys: keys, active_webhooks: webhooks,
      active_tokens: tokens, recent_activity: recentLogs,
      platform_version: '17.0.0',
      api_base_url: '/api',
      docs_url: '/api/api-docs',
    });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/developer-portal/quickstart
router.get('/quickstart', auth, async (_req, res) => {
  return ok(res, {
    steps: [
      { step: 1, title: 'Create an Application', description: 'POST /api/gateway with name and description', endpoint: 'POST /api/gateway' },
      { step: 2, title: 'Generate API Key',       description: 'POST /api/api-keys with application_id',      endpoint: 'POST /api/api-keys' },
      { step: 3, title: 'Register a Webhook',     description: 'POST /api/webhooks to receive event notifications', endpoint: 'POST /api/webhooks' },
      { step: 4, title: 'Connect a System',       description: 'POST /api/connectors to integrate an ERP/CRM',  endpoint: 'POST /api/connectors' },
      { step: 5, title: 'Publish an Event',       description: 'POST /api/events to trigger automations',       endpoint: 'POST /api/events' },
    ],
    code_samples: {
      curl: `curl -H "Authorization: Bearer YOUR_TOKEN" https://localwheels.com/api/gateway`,
      javascript: `const resp = await fetch('/api/gateway', { headers: { Authorization: 'Bearer YOUR_TOKEN' } });`,
      python: `import requests\nr = requests.get('/api/gateway', headers={'Authorization': 'Bearer YOUR_TOKEN'})`,
    },
  });
});

// GET /api/developer-portal/sdk
router.get('/sdk', auth, async (_req, res) => {
  return ok(res, {
    sdks: [
      { language: 'JavaScript/Node.js', status: 'available', install: 'npm install localwheels-sdk', repo: 'github.com/localwheels/sdk-js' },
      { language: 'Python',             status: 'available', install: 'pip install localwheels',     repo: 'github.com/localwheels/sdk-python' },
      { language: 'PHP',                status: 'beta',      install: 'composer require localwheels/sdk', repo: 'github.com/localwheels/sdk-php' },
      { language: 'Java',               status: 'coming_soon', install: 'maven: com.localwheels:sdk', repo: 'github.com/localwheels/sdk-java' },
    ],
  });
});

// GET /api/developer-portal/changelog
router.get('/changelog', auth, async (_req, res) => {
  return ok(res, {
    versions: [
      { version: '17.0.0', date: '2026-07-02', changes: ['Enterprise Integration Platform', 'API Gateway', 'Webhook Engine', 'OAuth2', 'Connector Marketplace', 'Event Bus', 'Developer Portal'] },
      { version: '16.0.0', date: '2026-06-01', changes: ['Hyper Automation', 'Workflow Builder', 'AI Workflow Generation', 'Approval Engine', 'Digital Workers', 'Enterprise Scheduler'] },
      { version: '15.0.0', date: '2026-05-01', changes: ['Enterprise Control Tower', 'Global Operations', 'Risk Center', 'AI Decision Engine'] },
    ],
  });
});

module.exports = router;
