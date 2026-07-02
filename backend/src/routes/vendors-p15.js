const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const Vendor = require('../models/Vendor');
const VendorContract = require('../models/VendorContract');

const ok  = (res, data, msg = 'Success', status = 200) => res.status(status).json({ status: true, message: msg, data });
const err = (res, msg, status = 400) => res.status(status).json({ status: false, message: msg });

// GET /api/vendors-p15 — list all vendors with contracts
router.get('/', auth, async (req, res) => {
  try {
    const { type, search, limit = 20, page = 1 } = req.query;
    const q = { company_id: req.user.company_id, is_active: true };
    if (type) q.type = type;
    if (search) q.name = { $regex: search, $options: 'i' };
    const skip = (Number(page) - 1) * Number(limit);
    const [vendors, total] = await Promise.all([
      Vendor.find(q).sort({ name: 1 }).skip(skip).limit(Number(limit)).lean(),
      Vendor.countDocuments(q),
    ]);
    ok(res, { vendors, total });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/vendors-p15/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!vendor) return err(res, 'Vendor not found', 404);
    const contracts = await VendorContract.find({ vendor_id: vendor._id, company_id: req.user.company_id }).sort({ end_date: 1 }).lean();
    ok(res, { vendor, contracts });
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/vendors-p15/:id/contracts
router.post('/:id/contracts', auth, async (req, res) => {
  try {
    const { title, type, start_date, end_date, value, payment_terms, sla_terms, auto_renew } = req.body;
    if (!title || !start_date || !end_date) return err(res, 'title, start_date, end_date required');
    const count = await VendorContract.countDocuments({ company_id: req.user.company_id });
    const contract_ref = `VC-${String(count + 1).padStart(4, '0')}`;
    const contract = await VendorContract.create({
      company_id: req.user.company_id, vendor_id: req.params.id,
      contract_ref, title, type, start_date, end_date, value, payment_terms, sla_terms, auto_renew,
      status: new Date(start_date) <= new Date() ? 'active' : 'draft',
    });
    ok(res, contract, 'Contract created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/vendors-p15/contracts/all
router.get('/contracts/all', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const q = { company_id: req.user.company_id };
    if (status) q.status = status;
    const contracts = await VendorContract.find(q).populate('vendor_id', 'name type').sort({ end_date: 1 }).lean();
    const now = new Date();
    const expiringSoon = contracts.filter(c => {
      const daysLeft = (new Date(c.end_date) - now) / 86400000;
      return daysLeft > 0 && daysLeft <= 30;
    });
    ok(res, { contracts, expiring_soon: expiringSoon, total: contracts.length });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/vendors-p15/analytics/summary
router.get('/analytics/summary', auth, async (req, res) => {
  try {
    const cid = req.user.company_id;
    const [total, preferred, contracts, totalSpend] = await Promise.all([
      Vendor.countDocuments({ company_id: cid, is_active: true }),
      Vendor.countDocuments({ company_id: cid, is_preferred: true }),
      VendorContract.countDocuments({ company_id: cid, status: 'active' }),
      Vendor.aggregate([
        { $match: { company_id: require('mongoose').Types.ObjectId.createFromHexString(String(cid)) } },
        { $group: { _id: null, total: { $sum: '$total_spend' } } },
      ]),
    ]);
    ok(res, { total, preferred, active_contracts: contracts, total_spend: totalSpend[0]?.total || 0 });
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
