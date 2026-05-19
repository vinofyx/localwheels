const RouteExpense = require('../models/RouteExpense');

// ── POST /api/route-expenses ──────────────────────────────────────────────────
const createRouteExpense = async (req, res) => {
  try {
    const { routeName, loadType, transitPeriodDays, routeDiesel, routeAdvance, tollAmount, expenses } = req.body;

    if (!routeName || !loadType || transitPeriodDays === undefined) {
      return res.status(400).json({ success: false, message: 'routeName, loadType, and transitPeriodDays are required' });
    }

    const data = await RouteExpense.create({
      company_id: req.user.company_id,     // ← scoped to company
      routeName, loadType, transitPeriodDays,
      routeDiesel:  routeDiesel  || 0,
      routeAdvance: routeAdvance || 0,
      tollAmount:   tollAmount   || 0,
      expenses:     expenses     || [],
    });
    res.status(201).json({ success: true, message: 'Route expense saved successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/route-expenses ───────────────────────────────────────────────────
const getAllRouteExpenses = async (req, res) => {
  try {
    const data = await RouteExpense.find({ company_id: req.user.company_id })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/route-expenses/:id ───────────────────────────────────────────────
const getRouteExpenseById = async (req, res) => {
  try {
    const data = await RouteExpense.findOne({ _id: req.params.id, company_id: req.user.company_id });
    if (!data) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PUT /api/route-expenses/:id ───────────────────────────────────────────────
const updateRouteExpense = async (req, res) => {
  try {
    const data = await RouteExpense.findOneAndUpdate(
      { _id: req.params.id, company_id: req.user.company_id },
      req.body,
      { new: true }
    );
    if (!data) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, message: 'Updated successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE /api/route-expenses/:id ───────────────────────────────────────────
const deleteRouteExpense = async (req, res) => {
  try {
    const data = await RouteExpense.findOneAndDelete({ _id: req.params.id, company_id: req.user.company_id });
    if (!data) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createRouteExpense, getAllRouteExpenses, getRouteExpenseById, updateRouteExpense, deleteRouteExpense };
