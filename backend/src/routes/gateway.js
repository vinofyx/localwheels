const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');
const { authenticate: auth } = require('../middleware/auth');

const ApiApplication  = require('../models/ApiApplication');
const ApiKey          = require('../models/ApiKey');
const ApiAuditLog     = require('../models/ApiAuditLog');
const ApiUsage        = require('../models/ApiUsage');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

// GET /api/gateway — list applications
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = { company_id: req.user.company_id };
    const [apps, total] = await Promise.all([
      ApiApplication.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(+limit).lean(),
      ApiApplication.countDocuments(filter),
    ]);
    return ok(res, { applications: apps, total, page: +page });
  } catch (e) { return err(res, e.message, 500); }
});

// POST /api/gateway — create application
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, app_type, scopes, rate_limit, contact_email } = req.body;
    if (!name) return err(res, 'name required');
    const app = await ApiApplication.create({
      company_id: req.user.company_id, name, description, app_type, scopes, rate_limit, contact_email,
      created_by: req.user._id,
    });
    return ok(res, app, 'Application created', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/gateway/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const app = await ApiApplication.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!app) return err(res, 'Not found', 404);
    const keys = await ApiKey.find({ application_id: app._id, status: 'active' }).select('-key_hash').lean();
    return ok(res, { application: app, api_keys: keys });
  } catch (e) { return err(res, e.message, 500); }
});

// PUT /api/gateway/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const app = await ApiApplication.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      req.body, { new: true }
    );
    if (!app) return err(res, 'Not found', 404);
    return ok(res, app);
  } catch (e) { return err(res, e.message, 500); }
});

// DELETE /api/gateway/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await ApiApplication.findOneAndDelete({ _id: req.params.id, company_id: req.user.company_id });
    return ok(res, null, 'Application deleted');
  } catch (e) { return err(res, e.message, 500); }
});

// GET /api/gateway/stats/overview
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [apps, keys, recentLogs] = await Promise.all([
      ApiApplication.countDocuments({ company_id: cid }),
      ApiKey.countDocuments({ company_id: cid, status: 'active' }),
      ApiAuditLog.find({ company_id: cid }).sort({ logged_at: -1 }).limit(10).lean(),
    ]);
    return ok(res, { total_applications: apps, active_api_keys: keys, recent_logs: recentLogs });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
