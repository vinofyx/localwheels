const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const { authenticate: auth } = require('../middleware/auth');

const ApiKey = require('../models/ApiKey');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// GET /api/api-keys
router.get('/', auth, async (req, res) => {
  try {
    const { application_id, environment, status } = req.query;
    const filter = { company_id: req.user.company_id };
    if (application_id) filter.application_id = application_id;
    if (environment)    filter.environment = environment;
    if (status)         filter.status = status;
    const keys = await ApiKey.find(filter).select('-key_hash').sort({ createdAt: -1 }).lean();
    return ok(res, { keys, total: keys.length });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/api-keys — generate new key
router.post('/', auth, async (req, res) => {
  try {
    const { name, application_id, scopes, environment, expires_at, rate_limit, allowed_ips } = req.body;
    if (!name) return err(res, 'name required');

    const raw = `lw_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(raw).digest('hex');
    const keyPrefix = raw.substring(0, 12);

    const apiKey = await ApiKey.create({
      company_id: req.user.company_id, name, application_id, scopes, environment,
      expires_at: expires_at ? new Date(expires_at) : undefined,
      rate_limit, allowed_ips, key_hash: keyHash, key_prefix: keyPrefix,
      created_by: req.user._id,
    });

    const safeKey = apiKey.toObject();
    delete safeKey.key_hash;
    safeKey.raw_key = raw; // shown once only
    return ok(res, safeKey, 'API key generated — save the raw key, it will not be shown again', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/api-keys/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const key = await ApiKey.findOne({ _id: req.params.id, company_id: req.user.company_id }).select('-key_hash').lean();
    if (!key) return err(res, 'Not found', 404);
    return ok(res, key);
  } catch (e) { return err(res, e.message, 500); }
});

// PUT /api/api-keys/:id/revoke
router.put('/:id/revoke', auth, async (req, res) => {
  try {
    const key = await ApiKey.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { status: 'revoked' }, { new: true }
    );
    if (!key) return err(res, 'Not found', 404);
    return ok(res, { _id: key._id, status: key.status }, 'API key revoked');
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/api-keys/:id/rotate — revoke + create new
router.post('/:id/rotate', auth, async (req, res) => {
  try {
    const old = await ApiKey.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!old) return err(res, 'Not found', 404);
    await ApiKey.findByIdAndUpdate(old._id, { status: 'revoked' });

    const raw      = `lw_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash  = crypto.createHash('sha256').update(raw).digest('hex');
    const newKey   = await ApiKey.create({
      company_id: req.user.company_id, name: old.name + ' (rotated)',
      application_id: old.application_id, scopes: old.scopes,
      environment: old.environment, rate_limit: old.rate_limit,
      allowed_ips: old.allowed_ips, key_hash: keyHash,
      key_prefix: raw.substring(0, 12), created_by: req.user._id,
    });

    const safe = newKey.toObject(); delete safe.key_hash;
    safe.raw_key = raw;
    return ok(res, { old_key_revoked: old._id, new_key: safe }, 'API key rotated');
  } catch (e) { return err(res, e.message, 500); }
});

// DELETE /api/api-keys/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await ApiKey.findOneAndDelete({ _id: req.params.id, company_id: req.user.company_id });
    return ok(res, null, 'Deleted');
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
