const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const { authenticate: auth } = require('../middleware/auth');

const OAuthToken    = require('../models/OAuthToken');
const ApiApplication = require('../models/ApiApplication');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// POST /api/oauth/token — issue access token
router.post('/token', auth, async (req, res) => {
  try {
    const { application_id, scopes, client_id } = req.body;
    if (!application_id) return err(res, 'application_id required');

    const app = await ApiApplication.findOne({ _id: application_id, company_id: req.user.company_id });
    if (!app) return err(res, 'Application not found', 404);

    const raw      = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    const token = await OAuthToken.create({
      company_id: req.user.company_id, application_id, user_id: req.user._id,
      token_type: 'access', token_hash: tokenHash, scopes: scopes || app.scopes,
      expires_at: expiresAt, client_id: client_id || app._id.toString(),
      ip_address: req.ip,
    });

    return ok(res, {
      access_token: raw,
      token_type:   'Bearer',
      expires_in:   3600,
      scopes:       token.scopes,
      issued_at:    new Date().toISOString(),
    }, 'Token issued', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/oauth/revoke
router.post('/revoke', auth, async (req, res) => {
  try {
    const { token_id } = req.body;
    if (!token_id) return err(res, 'token_id required');
    await OAuthToken.findOneAndUpdate(
      { _id: token_id, company_id: req.user.company_id },
      { revoked: true, revoked_at: new Date() }
    );
    return ok(res, null, 'Token revoked');
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/oauth/tokens
router.get('/tokens', auth, async (req, res) => {
  try {
    const tokens = await OAuthToken.find({
      company_id: req.user.company_id, revoked: false,
      expires_at: { $gt: new Date() },
    }).select('-token_hash').sort({ createdAt: -1 }).lean();
    return ok(res, { tokens, total: tokens.length });
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/oauth/scopes
router.get('/scopes', auth, async (_req, res) => {
  const scopes = [
    'shipments:read','shipments:write','complaints:read','complaints:write',
    'fleet:read','fleet:write','invoices:read','invoices:write',
    'leads:read','leads:write','reports:read','automation:read','automation:write',
    'webhooks:read','webhooks:write','analytics:read','admin:all',
  ];
  return ok(res, { scopes });
});

module.exports = router;
