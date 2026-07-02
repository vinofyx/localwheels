const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const BankReconciliation = require('../models/BankReconciliation');
const BankTransaction = require('../models/BankTransaction');
const BankAccount = require('../models/BankAccount');

const ok = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

// GET /unreconciled/:account_id — before /:id to avoid route conflict
router.get('/unreconciled/:account_id', async (req, res) => {
  try {
    const data = await BankTransaction.find({
      bank_account_id: req.params.account_id,
      company_id: req.user.company_id,
      is_reconciled: { $ne: true },
    }).sort({ transaction_date: -1 });
    return ok(res, data);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// GET / — list BankReconciliation
router.get('/', async (req, res) => {
  try {
    const data = await BankReconciliation.find({ company_id: req.user.company_id }).sort({ created_at: -1 });
    return ok(res, data);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// POST / — create BankReconciliation
router.post('/', async (req, res) => {
  try {
    const { bank_account_id, period_start, period_end, statement_balance } = req.body;
    const company_id = req.user.company_id;

    // Compute book_balance from BankTransaction sum in period
    const txAgg = await BankTransaction.aggregate([
      {
        $match: {
          company_id,
          bank_account_id,
          transaction_date: { $gte: new Date(period_start), $lte: new Date(period_end) },
        },
      },
      {
        $group: {
          _id: null,
          credits: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
          debits: { $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] } },
        },
      },
    ]);
    const book_balance = txAgg.length ? (txAgg[0].credits - txAgg[0].debits) : 0;
    const difference = parseFloat(statement_balance) - book_balance;

    const unmatched_count = await BankTransaction.countDocuments({
      company_id,
      bank_account_id,
      transaction_date: { $gte: new Date(period_start), $lte: new Date(period_end) },
      is_reconciled: { $ne: true },
    });

    const reconciliation = await BankReconciliation.create({
      ...req.body,
      company_id,
      book_balance,
      difference,
      unmatched_count,
      matched_count: 0,
      status: 'open',
      created_by: req.user.id,
    });
    return ok(res, reconciliation, 'Reconciliation created', 201);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const reconciliation = await BankReconciliation.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!reconciliation) return err(res, 'Not found', 404);
    const transactions = await BankTransaction.find({
      reconciliation_id: req.params.id,
      company_id: req.user.company_id,
    });
    return ok(res, { reconciliation, transactions });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// PUT /:id/match
router.put('/:id/match', async (req, res) => {
  try {
    const { transaction_ids = [] } = req.body;
    const reconciliation = await BankReconciliation.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!reconciliation) return err(res, 'Not found', 404);

    await BankTransaction.updateMany(
      { _id: { $in: transaction_ids }, company_id: req.user.company_id },
      { is_reconciled: true, reconciliation_id: req.params.id }
    );

    const matched = transaction_ids.length;
    reconciliation.matched_count = (reconciliation.matched_count || 0) + matched;
    reconciliation.unmatched_count = Math.max(0, (reconciliation.unmatched_count || 0) - matched);
    await reconciliation.save();

    return ok(res, reconciliation, 'Transactions matched');
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// PUT /:id/complete
router.put('/:id/complete', async (req, res) => {
  try {
    const reconciliation = await BankReconciliation.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!reconciliation) return err(res, 'Not found', 404);

    reconciliation.status = 'completed';
    reconciliation.completed_by = req.user.id;
    reconciliation.completed_at = new Date();
    await reconciliation.save();

    await BankAccount.findOneAndUpdate(
      { _id: reconciliation.bank_account_id, company_id: req.user.company_id },
      { last_reconciled_at: reconciliation.period_end }
    );

    return ok(res, reconciliation, 'Reconciliation completed');
  } catch (e) {
    return err(res, e.message, 500);
  }
});

module.exports = router;
