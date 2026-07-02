const express = require('express');
const router  = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const GeneralLedger  = require('../models/GeneralLedger');
const JournalEntry   = require('../models/JournalEntry');
const ChartOfAccount = require('../models/ChartOfAccount');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true,  message: msg,   data });
const err = (res, msg = 'Error', status = 400)    => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

// GET /trial-balance
router.get('/trial-balance', async (req, res) => {
  try {
    const company_id = String(req.user.company_id);
    const rows = await GeneralLedger.aggregate([
      { $match: { company_id } },
      {
        $group: {
          _id:          '$account_id',
          account_code: { $first: '$account_code' },
          account_name: { $first: '$account_name' },
          total_debits: { $sum: '$debit_amount'  },
          total_credits:{ $sum: '$credit_amount' }
        }
      },
      { $sort: { account_code: 1 } }
    ]);
    ok(res, rows);
  } catch (e) { err(res, e.message, 500); }
});

// POST /post
router.post('/post', async (req, res) => {
  try {
    const { journal_id } = req.body;
    const company_id     = String(req.user.company_id);

    const journal = await JournalEntry.findOne({ _id: journal_id, company_id });
    if (!journal) return err(res, 'Journal entry not found', 404);
    if (journal.status === 'posted') return err(res, 'Journal already posted');

    const lines      = journal.lines || [];
    const glEntries  = [];

    for (const line of lines) {
      const glEntry = await GeneralLedger.create({
        company_id,
        journal_id:   journal._id,
        account_id:   line.account_id,
        account_code: line.account_code,
        account_name: line.account_name,
        entry_date:   journal.entry_date || new Date(),
        description:  line.description || journal.description,
        debit_amount:  line.debit_amount  || 0,
        credit_amount: line.credit_amount || 0,
        reference:    journal.reference
      });
      glEntries.push(glEntry);

      // Update ChartOfAccount balance
      const balanceDelta = (line.debit_amount || 0) - (line.credit_amount || 0);
      await ChartOfAccount.findByIdAndUpdate(line.account_id, {
        $inc: { current_balance: balanceDelta }
      });
    }

    journal.status = 'posted';
    await journal.save();

    ok(res, { journal, gl_entries: glEntries }, 'Journal posted successfully');
  } catch (e) { err(res, e.message, 500); }
});

// GET /account/:account_id
router.get('/account/:account_id', async (req, res) => {
  try {
    const company_id = String(req.user.company_id);
    const entries    = await GeneralLedger.find({
      company_id,
      account_id: req.params.account_id
    }).sort({ entry_date: 1, createdAt: 1 });

    // Compute running balance (debit positive, credit negative convention)
    let running = 0;
    const result = entries.map(e => {
      running += (e.debit_amount || 0) - (e.credit_amount || 0);
      return { ...e.toObject(), running_balance: running };
    });

    ok(res, result);
  } catch (e) { err(res, e.message, 500); }
});

// GET /
router.get('/', async (req, res) => {
  try {
    const { account_id, account_code, date_from, date_to, page = 1 } = req.query;
    const company_id = String(req.user.company_id);
    const query      = { company_id };

    if (account_id)   query.account_id   = account_id;
    if (account_code) query.account_code = account_code;
    if (date_from || date_to) {
      query.entry_date = {};
      if (date_from) query.entry_date.$gte = new Date(date_from);
      if (date_to)   query.entry_date.$lte = new Date(date_to);
    }

    const skip = (Number(page) - 1) * 100;
    const [entries, total] = await Promise.all([
      GeneralLedger.find(query).sort({ entry_date: -1, createdAt: -1 }).skip(skip).limit(100),
      GeneralLedger.countDocuments(query)
    ]);
    ok(res, { entries, total, page: Number(page) });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
