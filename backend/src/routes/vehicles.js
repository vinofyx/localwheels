const express = require('express');
const router  = express.Router();
const Vehicle = require('../models/Vehicle');
const { authenticate, requireRole } = require('../middleware/auth');
const audit = require('../utils/audit');

const ok  = (res, data, message = 'Success', status = 200) => res.status(status).json({ status: true, message, data });
const err = (res, message, status = 400) => res.status(status).json({ status: false, message, errors: [message] });

router.use(authenticate);

// GET /api/vehicles
router.get('/', async (req, res) => {
  try {
    const { status, vehicle_type, branch_id, page = 1, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id, is_active: true };
    if (status)       q.status = status;
    if (vehicle_type) q.vehicle_type = vehicle_type;
    if (branch_id)    q.branch_id = branch_id;
    const skip = (Math.max(1, +page) - 1) * Math.min(+limit, 100);
    const lim  = Math.min(+limit, 100);
    const [vehicles, total] = await Promise.all([
      Vehicle.find(q).populate('branch_id', 'branch_name').populate('current_driver_id', 'name phone')
        .sort({ registration_number: 1 }).skip(skip).limit(lim).lean(),
      Vehicle.countDocuments(q),
    ]);
    ok(res, { vehicles, total, page: +page, pages: Math.ceil(total / lim) });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/vehicles/:id
router.get('/:id', async (req, res) => {
  try {
    const v = await Vehicle.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('branch_id', 'branch_name').populate('current_driver_id', 'name phone').lean();
    if (!v) return err(res, 'Vehicle not found', 404);
    ok(res, v);
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/vehicles
router.post('/', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { registration_number, vehicle_type, load_type, capacity_tons, make, model, year,
            insurance_expiry, fitness_expiry, permit_expiry, pollution_expiry, branch_id } = req.body;
    if (!registration_number) return err(res, 'registration_number is required');
    const v = await Vehicle.create({
      company_id: req.user.company_id,
      registration_number, vehicle_type, load_type, capacity_tons, make, model, year,
      insurance_expiry, fitness_expiry, permit_expiry, pollution_expiry, branch_id,
    });
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'CREATE', resource: 'Vehicle', resource_id: v._id, resource_ref: registration_number, req });
    ok(res, v, 'Vehicle created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/vehicles/:id
router.put('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const v = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: req.body }, { new: true, runValidators: true }
    );
    if (!v) return err(res, 'Vehicle not found', 404);
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'UPDATE', resource: 'Vehicle', resource_id: v._id, resource_ref: v.registration_number, changes: req.body, req });
    ok(res, v, 'Vehicle updated');
  } catch (e) { err(res, e.message, 500); }
});

// PATCH /api/vehicles/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['available', 'in_transit', 'maintenance', 'inactive'];
    if (!allowed.includes(status)) return err(res, `status must be one of: ${allowed.join(', ')}`);
    const v = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { status } }, { new: true }
    );
    if (!v) return err(res, 'Vehicle not found', 404);
    ok(res, v, 'Status updated');
  } catch (e) { err(res, e.message, 500); }
});

// DELETE /api/vehicles/:id
router.delete('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const v = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { is_active: false, status: 'inactive' } }, { new: true }
    );
    if (!v) return err(res, 'Vehicle not found', 404);
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'DELETE', resource: 'Vehicle', resource_id: v._id, resource_ref: v.registration_number, req });
    ok(res, null, 'Vehicle deleted');
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
