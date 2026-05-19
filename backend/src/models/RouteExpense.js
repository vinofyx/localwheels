const mongoose = require('mongoose');

const expenseItemSchema = new mongoose.Schema({
  routeCharge: { type: String, required: true },
  amount:      { type: Number, default: 0 },
});

const routeExpenseSchema = new mongoose.Schema(
  {
    company_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    routeName:         { type: String, required: true },
    loadType:          { type: String, required: true },
    transitPeriodDays: { type: Number, required: true },
    routeDiesel:       { type: Number, default: 0 },
    routeAdvance:      { type: Number, default: 0 },
    tollAmount:        { type: Number, default: 0 },
    expenses:          [expenseItemSchema],
  },
  { timestamps: true }
);

routeExpenseSchema.index({ company_id: 1, routeName: 1 });

module.exports = mongoose.model('RouteExpense', routeExpenseSchema);
