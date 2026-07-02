const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const BankAccount = require('../models/BankAccount');
const BankTransaction = require('../models/BankTransaction');

const ok = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

// GET /accounts
router.get('/accounts', async (req, res) => {
  try {
    const data = await BankAccount.find({ company_id: req.user.company_id }).sort({ created_at: -1 });
    return ok(res, data);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// POST /accounts
router.post('/accounts', async (req, res) => {
  try {
    const account = await BankAccount.create({ ...req.body, company_id: req.user.company_id, created_by: req.user.id });
    return ok(res, account, 'Bank account created', 201);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// GET /accounts/:id
router.get('/accounts/:id', async (req, res) => {
  try {
    const account = await BankAccount.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!account) return err(res, 'Not found', 404);
    return ok(res, account);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// PUT /accounts/:id
router.put('/accounts/:id', async (req, res) => {
  try {
    const account = await BankAccount.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      req.body,
      { new: true }
    );
    if (!account) return err(res, 'Not found', 404);
    return ok(res, account, 'Bank account updated');
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// GET /accounts/:id/transactions
router.get('/accounts/:id/transactions', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const limit = 100;
    const skip = (parseInt(page) - 1) * limit;
    const query = { bank_account_id: req.params.id, company_id: req.user.company_id };
    const [data, total] = await Promise.all([
      BankTransaction.find(query).sort({ transaction_date: -1 }).skip(skip).limit(limit),
      BankTransaction.countDocuments(query),
    ]);
    return ok(res, { data, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// POST /accounts/:id/transactions
router.post('/accounts/:id/transactions', async (req, res) => {
  try {
    const account = await BankAccount.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!account) return err(res, 'Bank account not found', 404);

    const { type, amount } = req.body;
    const parsedAmount = parseFloat(amount) || 0;
    const balanceDelta = type === 'credit' ? parsedAmount : -parsedAmount;

    const transaction = await BankTransaction.create({
      ...req.body,
      bank_account_id: req.params.id,
      company_id: req.user.company_id,
      created_by: req.user.id,
    });

    account.current_balance = (account.current_balance || 0) + balanceDelta;
    await account.save();

    return ok(res, transaction, 'Transaction created', 201);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// GET /accounts/:id/balance
router.get('/accounts/:id/balance', async (req, res) => {
  try {
    const account = await BankAccount.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!account) return err(res, 'Not found', 404);
    const unreconciled_count = await BankTransaction.countDocuments({
      bank_account_id: req.params.id,
      company_id: req.user.company_id,
      is_reconciled: { $ne: true },
    });
    return ok(res, {
      current_balance: account.current_balance || 0,
      last_reconciled_at: account.last_reconciled_at || null,
      unreconciled_count,
    });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

module.exports = router;
