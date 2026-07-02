const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth');
const DashboardPreference = require('../models/DashboardPreference');

// GET /api/dashboard-preferences — get current user's preferences
router.get('/', auth, async (req, res) => {
  try {
    let pref = await DashboardPreference.findOne({ user_id: req.user.id, company_id: req.user.company_id });
    if (!pref) {
      pref = await DashboardPreference.create({
        user_id: req.user.id,
        company_id: req.user.company_id,
        layout: 'executive',
        pinned_kpis: ['revenue_today','shipments_today','pending_today','complaints_open'],
        date_range: '30d',
      });
    }
    res.json({ preferences: pref });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dashboard-preferences — update preferences
router.put('/', auth, async (req, res) => {
  try {
    const { layout, pinned_kpis, hidden_widgets, date_range, auto_refresh, theme } = req.body;
    const pref = await DashboardPreference.findOneAndUpdate(
      { user_id: req.user.id, company_id: req.user.company_id },
      { layout, pinned_kpis, hidden_widgets, date_range, auto_refresh, theme },
      { upsert: true, new: true }
    );
    res.json({ preferences: pref });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
