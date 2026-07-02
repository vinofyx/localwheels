const mongoose = require('mongoose');

const vehicleExpenseSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fleet_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  vehicle_number:   { type: String },

  expense_type: {
    type: String,
    enum: ['fuel','maintenance','insurance','road_tax','permit','fitness','puc','driver_salary',
           'toll','parking','loading','unloading','fine','repair','tyre','battery','other'],
    required: true,
  },
  amount:       { type: Number, required: true },
  expense_date: { type: Date, default: Date.now },
  description:  { type: String },
  vendor:       { type: String },
  receipt_url:  { type: String },
  trip_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'OptimizedRoute' },
  created_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

vehicleExpenseSchema.index({ company_id: 1, fleet_vehicle_id: 1, expense_date: -1 });
vehicleExpenseSchema.index({ company_id: 1, expense_type: 1 });

module.exports = mongoose.model('VehicleExpense', vehicleExpenseSchema);
