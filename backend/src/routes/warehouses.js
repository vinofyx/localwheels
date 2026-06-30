const express   = require('express');
const router    = express.Router();
const Warehouse = require('../models/Warehouse');
const { authenticate, requireRole } = require('../middleware/auth');
const audit = require('../utils/audit');

const ok  = (res, data, message = 'Success', status = 200) => res.status(status).json({ status: true, message, data });
const err = (res, message, status = 400) => res.status(status).json({ status: false, message, errors: [message] });

router.use(authenticate);

// GET /api/warehouses
router.get('/', async (req, res) => {
  try {
    const { branch_id } = req.query;
    const q = { company_id: req.user.company_id, is_active: true };
    if (branch_id) q.branch_id = branch_id;
    const warehouses = await Warehouse.find(q)
      .populate('branch_id', 'branch_name city').sort({ name: 1 }).lean();
    ok(res, { warehouses, total: warehouses.length });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/warehouses/:id
router.get('/:id', async (req, res) => {
  try {
    const w = await Warehouse.findOne({ _id: req.params.id, company_id: req.user.company_id })
      .populate('branch_id', 'branch_name city').lean();
    if (!w) return err(res, 'Warehouse not found', 404);
    ok(res, w);
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/warehouses
router.post('/', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { name, branch_id, address, city, state, pincode, capacity_sqft, manager_name, manager_phone } = req.body;
    if (!name) return err(res, 'name is required');
    const w = await Warehouse.create({ company_id: req.user.company_id, name, branch_id, address, city, state, pincode, capacity_sqft, manager_name, manager_phone });
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'CREATE', resource: 'Warehouse', resource_id: w._id, resource_ref: name, req });
    ok(res, w, 'Warehouse created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/warehouses/:id
router.put('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const w = await Warehouse.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: req.body }, { new: true, runValidators: true }
    );
    if (!w) return err(res, 'Warehouse not found', 404);
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'UPDATE', resource: 'Warehouse', resource_id: w._id, resource_ref: w.name, changes: req.body, req });
    ok(res, w, 'Warehouse updated');
  } catch (e) { err(res, e.message, 500); }
});

// DELETE /api/warehouses/:id
router.delete('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const w = await Warehouse.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { is_active: false } }, { new: true }
    );
    if (!w) return err(res, 'Warehouse not found', 404);
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'DELETE', resource: 'Warehouse', resource_id: w._id, resource_ref: w.name, req });
    ok(res, null, 'Warehouse deleted');
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
