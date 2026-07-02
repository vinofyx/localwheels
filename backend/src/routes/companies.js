const express  = require('express');
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const { authenticate, requireRole } = require('../middleware/auth');
const Company  = require('../models/Company');
const Branch   = require('../models/Branch');
const User     = require('../models/User');
const AppSettings = require('../models/AppSettings');
const { initializeTenant } = require('../services/tenantInit');

const router = express.Router();

// GET /api/companies — list all (super_admin only)
router.get('/', authenticate, requireRole('super_admin'), async (req, res, next) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 }).lean();
    res.json(companies);
  } catch (err) { next(err); }
});

// GET /api/companies/mine — current company details (admin+)
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    if (!req.user.company_id) return res.status(404).json({ error: 'No company associated' });
    const company = await Company.findById(req.user.company_id).lean();
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (err) { next(err); }
});

// GET /api/companies/setup-status — wizard completion status
router.get('/setup-status', authenticate, async (req, res, next) => {
  try {
    if (!req.user.company_id) return res.json({ setup_completed: true }); // super_admin skips wizard
    const company = await Company.findById(req.user.company_id).select('setup_completed setup_step name').lean();
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json({ setup_completed: company.setup_completed, setup_step: company.setup_step, name: company.name });
  } catch (err) { next(err); }
});

// POST /api/companies — create company + default branch + admin user (super_admin only)
router.post('/', authenticate, requireRole('super_admin'), async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      name, subscription_plan = 'basic',
      admin_username, admin_password, admin_email, admin_name,
      branch_name = 'Head Office',
      phone, email, city, state, gstin,
    } = req.body;

    if (!name)            return res.status(400).json({ error: 'Company name is required' });
    if (!admin_username)  return res.status(400).json({ error: 'admin_username is required' });
    if (!admin_password)  return res.status(400).json({ error: 'admin_password is required' });
    if (admin_password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // Check uniqueness
    const existing = await Company.findOne({ name: name.trim() }).session(session);
    if (existing) return res.status(409).json({ error: 'Company name already exists' });

    const existingUser = await User.findOne({ username: admin_username.toLowerCase().trim() }).session(session);
    if (existingUser) return res.status(409).json({ error: 'Username already taken' });

    // 1. Create company
    const [company] = await Company.create([{
      name: name.trim(),
      subscription_plan,
      phone, email, city, state, gstin,
      setup_completed: false,
      setup_step: 0,
    }], { session });

    // 2. Create default branch
    const [branch] = await Branch.create([{
      company_id: company._id,
      branch_name: branch_name.trim(),
      location: city || '',
      is_active: true,
    }], { session });

    // 3. Create admin user
    const hash = await bcrypt.hash(admin_password, 10);
    const [user] = await User.create([{
      company_id: company._id,
      branch_ids: [branch._id],
      username:   admin_username.toLowerCase().trim(),
      password:   hash,
      full_name:  admin_name || admin_username,
      email:      admin_email || '',
      role:       'admin',
      is_active:  true,
    }], { session });

    await session.commitTransaction();

    // 4. Initialize tenant master data (outside transaction — idempotent)
    try {
      await initializeTenant(company._id);
    } catch (e) {
      console.error('tenantInit failed (non-fatal):', e.message);
    }

    res.status(201).json({
      company: { id: company._id, name: company.name },
      branch:  { id: branch._id, name: branch.branch_name },
      user:    { id: user._id, username: user.username, role: user.role },
      message: 'Company created successfully. Admin can now login and complete setup.',
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
});

// PUT /api/companies/mine — update company settings (admin)
router.put('/mine', authenticate, requireRole('admin', 'super_admin'), async (req, res, next) => {
  try {
    if (!req.user.company_id) return res.status(400).json({ error: 'No company context' });
    const allowed = [
      'name', 'phone', 'email', 'website', 'address', 'city', 'state', 'pincode',
      'gstin', 'pan', 'cin', 'business_type', 'industry', 'timezone', 'currency',
      'date_format', 'financial_year_start', 'logo_url', 'primary_color', 'brand_name',
      'setup_completed', 'setup_step',
    ];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }
    const company = await Company.findByIdAndUpdate(
      req.user.company_id, { $set: updates }, { new: true }
    );
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (err) { next(err); }
});

// GET /api/companies/settings — app settings for current company
router.get('/settings', authenticate, async (req, res, next) => {
  try {
    if (!req.user.company_id) return res.status(404).json({ error: 'No company context' });
    const settings = await AppSettings.findOne({ company_id: req.user.company_id }).lean();
    if (!settings) return res.status(404).json({ error: 'Settings not initialized' });
    // Mask sensitive credentials before sending
    if (settings.smtp?.password) settings.smtp.password = '••••••••';
    if (settings.sms?.api_key)   settings.sms.api_key = '••••••••';
    if (settings.whatsapp?.api_key) settings.whatsapp.api_key = '••••••••';
    res.json(settings);
  } catch (err) { next(err); }
});

// PUT /api/companies/settings — update app settings
router.put('/settings', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    if (!req.user.company_id) return res.status(400).json({ error: 'No company context' });
    const settings = await AppSettings.findOneAndUpdate(
      { company_id: req.user.company_id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ message: 'Settings updated', settings });
  } catch (err) { next(err); }
});

// GET /api/companies/master-config/:category — get master config lists
router.get('/master-config/:category', authenticate, async (req, res, next) => {
  try {
    if (!req.user.company_id) return res.status(400).json({ error: 'No company context' });
    const MasterConfig = require('../models/MasterConfig');
    const items = await MasterConfig.find({
      company_id: req.user.company_id,
      category: req.params.category,
      is_active: true,
    }).sort({ sort_order: 1 }).lean();
    res.json(items);
  } catch (err) { next(err); }
});

// POST /api/companies/master-config/:category — add item to a master config list
router.post('/master-config/:category', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    if (!req.user.company_id) return res.status(400).json({ error: 'No company context' });
    const MasterConfig = require('../models/MasterConfig');
    const item = await MasterConfig.create({
      ...req.body,
      company_id: req.user.company_id,
      category: req.params.category,
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
});

module.exports = router;
