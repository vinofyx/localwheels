const express = require('express');
const router  = express.Router();
const Driver  = require('../models/Driver');
const { authenticate, requireRole } = require('../middleware/auth');
const audit = require('../utils/audit');

const ok  = (res, data, message = 'Success', status = 200) => res.status(status).json({ status: true, message, data });
const err = (res, message, status = 400) => res.status(status).json({ status: false, message, errors: [message] });

router.use(authenticate);

// GET /api/drivers
router.get('/', async (req, res) => {
  try {
    const { status, branch_id, search, page = 1, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id, is_active: true };
    if (status)    q.status = status;
    if (branch_id) q.branch_id = branch_id;
    if (search)    q.$or = [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }];
    const skip = (Math.max(1, +page) - 1) * Math.min(+limit, 100);
    const lim  = Math.min(+limit, 100);
    const [drivers, total] = await Promise.all([
      Driver.find(q).populate('branch_id', 'branch_name').populate('current_vehicle_id', 'registration_number')
        .sort({ name: 1 }).skip(skip).limit(lim).lean(),
      Driver.countDocuments(q),
    ]);
    ok(res, { drivers, total, page: +page, pages: Math.ceil(total / lim) });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/drivers/:id
router.get('/:id', async (req, res) => {
  try {
    const d = await Driver.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('branch_id', 'branch_name').populate('current_vehicle_id', 'registration_number vehicle_type').lean();
    if (!d) return err(res, 'Driver not found', 404);
    ok(res, d);
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/drivers
router.post('/', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { name, phone, alternate_phone, license_number, license_expiry, address, city,
            emergency_contact, date_of_joining, branch_id } = req.body;
    if (!name || !phone || !license_number)
      return err(res, 'name, phone, license_number are required');
    const d = await Driver.create({
      company_id: req.user.company_id,
      name, phone, alternate_phone, license_number, license_expiry, address, city,
      emergency_contact, date_of_joining, branch_id,
    });
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'CREATE', resource: 'Driver', resource_id: d._id, resource_ref: name, req });
    ok(res, d, 'Driver created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/drivers/:id
router.put('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const d = await Driver.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: req.body }, { new: true, runValidators: true }
    );
    if (!d) return err(res, 'Driver not found', 404);
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'UPDATE', resource: 'Driver', resource_id: d._id, resource_ref: d.name, changes: req.body, req });
    ok(res, d, 'Driver updated');
  } catch (e) { err(res, e.message, 500); }
});

// PATCH /api/drivers/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['available', 'on_trip', 'leave', 'inactive'];
    if (!allowed.includes(status)) return err(res, `status must be one of: ${allowed.join(', ')}`);
    const d = await Driver.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { status } }, { new: true }
    );
    if (!d) return err(res, 'Driver not found', 404);
    ok(res, d, 'Status updated');
  } catch (e) { err(res, e.message, 500); }
});

// DELETE /api/drivers/:id
router.delete('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const d = await Driver.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { is_active: false, status: 'inactive' } }, { new: true }
    );
    if (!d) return err(res, 'Driver not found', 404);
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'DELETE', resource: 'Driver', resource_id: d._id, resource_ref: d.name, req });
    ok(res, null, 'Driver deleted');
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
