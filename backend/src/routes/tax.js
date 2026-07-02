const express        = require('express');
const router         = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const TaxTransaction = require('../models/TaxTransaction');
const GSTReturn      = require('../models/GSTReturn');
const TDSRecord      = require('../models/TDSRecord');

const ok  = (res, data, msg = 'OK', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg = 'Error', status = 400) => res.status(status).json({ status: false, message: msg, errors: [msg] });

router.use(auth);

// GET /transactions
router.get('/transactions', async (req, res) => {
  try {
    const { tax_type, return_period, date_from, date_to } = req.query;
    const filter = { company_id: req.user.company_id };
    if (tax_type) filter.tax_type = tax_type;
    if (return_period) filter.return_period = return_period;
    if (date_from || date_to) {
      filter.transaction_date = {};
      if (date_from) filter.transaction_date.$gte = new Date(date_from);
      if (date_to)   filter.transaction_date.$lte = new Date(date_to);
    }
    const transactions = await TaxTransaction.find(filter).sort({ transaction_date: -1 }).limit(100);
    return ok(res, transactions);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /transactions
router.post('/transactions', async (req, res) => {
  try {
    const txn = await TaxTransaction.create({ company_id: req.user.company_id, ...req.body });
    return ok(res, txn, 'Tax transaction created', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /gst-returns
router.get('/gst-returns', async (req, res) => {
  try {
    const returns = await GSTReturn.find({ company_id: req.user.company_id }).sort({ createdAt: -1 });
    return ok(res, returns);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /gst-returns
router.post('/gst-returns', async (req, res) => {
  try {
    const {
      return_type, return_period, financial_year, gstin,
      outward_supply, inward_supply,
      igst_liability = 0, cgst_liability = 0, sgst_liability = 0, itc_claimed = 0
    } = req.body;
    const total_tax   = igst_liability + cgst_liability + sgst_liability;
    const net_payable = total_tax - itc_claimed;
    const gstReturn   = await GSTReturn.create({
      company_id: req.user.company_id,
      return_type, return_period, financial_year, gstin,
      outward_supply, inward_supply,
      igst_liability, cgst_liability, sgst_liability, itc_claimed,
      total_tax, net_payable,
      status: 'pending'
    });
    return ok(res, gstReturn, 'GST return created', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// PUT /gst-returns/:id/file
router.put('/gst-returns/:id/file', async (req, res) => {
  try {
    const gstReturn = await GSTReturn.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { status: 'filed', filed_at: new Date() } },
      { new: true }
    );
    if (!gstReturn) return err(res, 'Not found', 404);
    return ok(res, gstReturn, 'GST return filed');
  } catch (e) { return err(res, e.message, 500); }
});

// GET /tds
router.get('/tds', async (req, res) => {
  try {
    const { financial_year, return_quarter } = req.query;
    const filter = { company_id: req.user.company_id };
    if (financial_year) filter.financial_year = financial_year;
    if (return_quarter) filter.return_quarter = return_quarter;
    const records = await TDSRecord.find(filter).sort({ createdAt: -1 });
    return ok(res, records);
  } catch (e) { return err(res, e.message, 500); }
});

// POST /tds
router.post('/tds', async (req, res) => {
  try {
    const { tds_amount = 0, surcharge = 0, cess = 0, ...rest } = req.body;
    const total_tds = tds_amount + surcharge + cess;
    const record = await TDSRecord.create({
      company_id: req.user.company_id,
      tds_amount, surcharge, cess, total_tds,
      ...rest
    });
    return ok(res, record, 'TDS record created', 201);
  } catch (e) { return err(res, e.message, 500); }
});

// GET /dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const now   = new Date();
    const som   = new Date(now.getFullYear(), now.getMonth(), 1);
    const soy   = new Date(now.getFullYear(), 3, 1); // April start for Indian FY
    if (now.getMonth() < 3) soy.setFullYear(now.getFullYear() - 1);

    const [gstAgg, itcAgg, tdsAgg, pendingFilings] = await Promise.all([
      GSTReturn.aggregate([
        { $match: { company_id: req.user.company_id, createdAt: { $gte: som } } },
        { $group: { _id: null, total: { $sum: '$net_payable' } } }
      ]),
      GSTReturn.aggregate([
        { $match: { company_id: req.user.company_id, status: { $ne: 'filed' } } },
        { $group: { _id: null, total: { $sum: '$itc_claimed' } } }
      ]),
      TDSRecord.aggregate([
        { $match: { company_id: req.user.company_id, createdAt: { $gte: soy } } },
        { $group: { _id: null, total: { $sum: '$total_tds' } } }
      ]),
      GSTReturn.countDocuments({ company_id: req.user.company_id, status: { $ne: 'filed' } })
    ]);

    return ok(res, {
      gst_liability_this_month: gstAgg[0]?.total || 0,
      itc_available:            itcAgg[0]?.total || 0,
      tds_deducted_ytd:         tdsAgg[0]?.total || 0,
      pending_filings:          pendingFilings
    });
  } catch (e) { return err(res, e.message, 500); }
});

module.exports = router;
