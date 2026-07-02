const express = require('express');
const router  = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const ChartOfAccount = require('../models/ChartOfAccount');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true,  message: msg,   data });
const err = (res, msg = 'Error', status = 400)    => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

// GET /tree
router.get('/tree', async (req, res) => {
  try {
    const company_id = String(req.user.company_id);
    const accounts   = await ChartOfAccount.find({ company_id }).sort({ account_code: 1 });

    // Build parent-child hierarchy: level-1 accounts (no parent_id) as roots
    const map     = {};
    const roots   = [];

    for (const acc of accounts) {
      map[String(acc._id)] = { ...acc.toObject(), children: [] };
    }
    for (const acc of accounts) {
      if (acc.parent_id && map[String(acc.parent_id)]) {
        map[String(acc.parent_id)].children.push(map[String(acc._id)]);
      } else {
        roots.push(map[String(acc._id)]);
      }
    }

    ok(res, roots);
  } catch (e) { err(res, e.message, 500); }
});

// GET /types
router.get('/types', async (req, res) => {
  try {
    const company_id = String(req.user.company_id);
    const rows = await ChartOfAccount.aggregate([
      { $match: { company_id } },
      { $group: { _id: '$account_type', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    ok(res, rows.map(r => ({ account_type: r._id, count: r.count })));
  } catch (e) { err(res, e.message, 500); }
});

// GET /
router.get('/', async (req, res) => {
  try {
    const { account_type, is_active } = req.query;
    const company_id = String(req.user.company_id);
    const query      = { company_id };
    if (account_type)          query.account_type = account_type;
    if (is_active !== undefined) query.is_active  = is_active === 'true';
    const accounts = await ChartOfAccount.find(query).sort({ account_code: 1 });
    ok(res, accounts);
  } catch (e) { err(res, e.message, 500); }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const company_id = String(req.user.company_id);
    const { account_code } = req.body;

    const exists = await ChartOfAccount.findOne({ company_id, account_code });
    if (exists) return err(res, `Account code '${account_code}' already exists for this company`);

    const account = await ChartOfAccount.create({ company_id, ...req.body });
    ok(res, account, 'Account created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const account = await ChartOfAccount.findOne({ _id: req.params.id, company_id: String(req.user.company_id) });
    if (!account) return err(res, 'Account not found', 404);
    ok(res, account);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const { name, description, is_active } = req.body;
    const update = {};
    if (name        !== undefined) update.name        = name;
    if (description !== undefined) update.description = description;
    if (is_active   !== undefined) update.is_active   = is_active;

    const account = await ChartOfAccount.findOneAndUpdate(
      { _id: req.params.id, company_id: String(req.user.company_id) },
      update,
      { new: true }
    );
    if (!account) return err(res, 'Account not found', 404);
    ok(res, account, 'Account updated');
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
