const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  createRouteExpense,
  getAllRouteExpenses,
  getRouteExpenseById,
  updateRouteExpense,
  deleteRouteExpense,
} = require('../controllers/routeExpenseController');

const router = express.Router();

// All route-expense endpoints require a valid JWT
router.use(authenticate);

router.post('/',      createRouteExpense);
router.get('/',       getAllRouteExpenses);
router.get('/:id',    getRouteExpenseById);
router.put('/:id',    updateRouteExpense);
router.delete('/:id', deleteRouteExpense);

module.exports = router;
