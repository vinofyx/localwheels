const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const JournalEntry = require('../models/JournalEntry');
const GeneralLedger = require('../models/GeneralLedger');
const ChartOfAccount = require('../models/ChartOfAccount');

const ok = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

// GET /stats — must be before /:id
router.get('/stats', async (req, res) => {
  try {
    const company_id = req.user.company_id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [total_journals, posted_count, draft_count, total_postings_this_month] = await Promise.all([
      JournalEntry.countDocuments({ company_id }),
      JournalEntry.countDocuments({ company_id, status: 'posted' }),
      JournalEntry.countDocuments({ company_id, status: 'draft' }),
      JournalEntry.countDocuments({ company_id, status: 'posted', posted_at: { $gte: monthStart } }),
    ]);
    return ok(res, { total_journals, posted_count, draft_count, total_postings_this_month });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// GET / — list JournalEntry
router.get('/', async (req, res) => {
  try {
    const { status, date_from, date_to, financial_year, page = 1 } = req.query;
    const query = { company_id: req.user.company_id };
    if (status) query.status = status;
    if (financial_year) query.financial_year = financial_year;
    if (date_from || date_to) {
      query.journal_date = {};
      if (date_from) query.journal_date.$gte = new Date(date_from);
      if (date_to) query.journal_date.$lte = new Date(date_to);
    }
    const limit = 50;
    const skip = (parseInt(page) - 1) * limit;
    const [data, total] = await Promise.all([
      JournalEntry.find(query).sort({ journal_date: -1 }).skip(skip).limit(limit),
      JournalEntry.countDocuments(query),
    ]);
    return ok(res, { data, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// POST / — create JournalEntry
router.post('/', async (req, res) => {
  try {
    const { journal_no, journal_date, description, lines = [], reference_type, reference_id, financial_year } = req.body;
    const total_debit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
    const total_credit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
    const is_balanced = Math.abs(total_debit - total_credit) < 0.001;
    if (!is_balanced) return err(res, 'Journal is not balanced');
    const journal = await JournalEntry.create({
      company_id: req.user.company_id,
      journal_no,
      journal_date,
      description,
      lines,
      reference_type,
      reference_id,
      financial_year,
      total_debit,
      total_credit,
      is_balanced,
      status: 'draft',
      created_by: req.user.id,
    });
    return ok(res, journal, 'Journal created', 201);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const journal = await JournalEntry.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!journal) return err(res, 'Not found', 404);
    return ok(res, journal);
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// PUT /:id/post
router.put('/:id/post', async (req, res) => {
  try {
    const journal = await JournalEntry.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!journal) return err(res, 'Not found', 404);
    if (!journal.is_balanced) return err(res, 'Journal is not balanced');
    if (journal.status === 'posted') return err(res, 'Already posted');

    journal.status = 'posted';
    journal.posted_at = new Date();
    journal.posted_by = req.user.id;
    await journal.save();

    for (const line of journal.lines) {
      await GeneralLedger.findOneAndUpdate(
        { company_id: req.user.company_id, account_id: line.account_id, journal_id: journal._id },
        {
          company_id: req.user.company_id,
          account_id: line.account_id,
          journal_id: journal._id,
          entry_date: journal.journal_date,
          debit: line.debit || 0,
          credit: line.credit || 0,
          description: line.description,
        },
        { upsert: true, new: true }
      );
      const delta = (parseFloat(line.debit) || 0) - (parseFloat(line.credit) || 0);
      await ChartOfAccount.findOneAndUpdate(
        { _id: line.account_id, company_id: req.user.company_id },
        { $inc: { current_balance: delta } }
      );
    }
    return ok(res, journal, 'Journal posted');
  } catch (e) {
    return err(res, e.message, 500);
  }
});

// PUT /:id/reverse
router.put('/:id/reverse', async (req, res) => {
  try {
    const journal = await JournalEntry.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!journal) return err(res, 'Not found', 404);
    if (journal.status !== 'posted') return err(res, 'Only posted journals can be reversed');

    const reversalLines = journal.lines.map(l => ({
      account_id: l.account_id,
      account_code: l.account_code,
      account_name: l.account_name,
      debit: l.credit || 0,
      credit: l.debit || 0,
      description: l.description,
    }));
    const reversal = await JournalEntry.create({
      company_id: req.user.company_id,
      journal_no: `REV-${journal.journal_no}`,
      journal_date: new Date(),
      description: `Reversal of ${journal.journal_no}`,
      lines: reversalLines,
      reference_type: 'reversal',
      reference_id: journal._id,
      financial_year: journal.financial_year,
      total_debit: journal.total_credit,
      total_credit: journal.total_debit,
      is_balanced: true,
      status: 'draft',
      created_by: req.user.id,
    });

    journal.status = 'reversed';
    journal.reversal_journal_id = reversal._id;
    await journal.save();

    return ok(res, { original: journal, reversal }, 'Journal reversed');
  } catch (e) {
    return err(res, e.message, 500);
  }
});

module.exports = router;
