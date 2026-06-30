const express  = require('express');
const router   = express.Router();
const Customer = require('../models/Customer');
const { authenticate, requireRole } = require('../middleware/auth');
const audit = require('../utils/audit');

const ok  = (res, data, message = 'Success', status = 200) => res.status(status).json({ status: true, message, data });
const err = (res, message, status = 400) => res.status(status).json({ status: false, message, errors: [message] });

router.use(authenticate);

// GET /api/customers — list (paginated)
router.get('/', async (req, res) => {
  try {
    const { search, customer_type, page = 1, limit = 20 } = req.query;
    const q = { company_id: req.user.company_id, is_active: true };
    if (customer_type) q.customer_type = customer_type;
    if (search) q.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const skip  = (Math.max(1, +page) - 1) * Math.min(+limit, 100);
    const lim   = Math.min(+limit, 100);
    const [customers, total] = await Promise.all([
      Customer.find(q).sort({ name: 1 }).skip(skip).limit(lim).lean(),
      Customer.countDocuments(q),
    ]);
    ok(res, { customers, total, page: +page, pages: Math.ceil(total / lim) });
  } catch (e) { err(res, e.message, 500); }
});

// GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const c = await Customer.findOne({ _id: req.params.id, company_id: req.user.company_id }).lean();
    if (!c) return err(res, 'Customer not found', 404);
    ok(res, c);
  } catch (e) { err(res, e.message, 500); }
});

// POST /api/customers
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address, city, state, pincode, gst_number, customer_type, credit_limit, credit_days, notes } = req.body;
    if (!name) return err(res, 'name is required');
    const c = await Customer.create({ company_id: req.user.company_id, name, phone, email, address, city, state, pincode, gst_number, customer_type, credit_limit, credit_days, notes });
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'CREATE', resource: 'Customer', resource_id: c._id, resource_ref: name, req });
    ok(res, c, 'Customer created', 201);
  } catch (e) { err(res, e.message, 500); }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  try {
    const c = await Customer.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!c) return err(res, 'Customer not found', 404);
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'UPDATE', resource: 'Customer', resource_id: c._id, resource_ref: c.name, changes: req.body, req });
    ok(res, c, 'Customer updated');
  } catch (e) { err(res, e.message, 500); }
});

// DELETE /api/customers/:id  (soft delete)
router.delete('/:id', requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const c = await Customer.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      { $set: { is_active: false } },
      { new: true }
    );
    if (!c) return err(res, 'Customer not found', 404);
    await audit.log({ company_id: req.user.company_id, user: req.user, action: 'DELETE', resource: 'Customer', resource_id: c._id, resource_ref: c.name, req });
    ok(res, null, 'Customer deleted');
  } catch (e) { err(res, e.message, 500); }
});

module.exports = router;
