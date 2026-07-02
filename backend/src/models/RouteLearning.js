const mongoose = require('mongoose');

const routeLearningSchema = new mongoose.Schema({
  company_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  route_id:           { type: mongoose.Schema.Types.ObjectId, ref: 'OptimizedRoute' },
  trip_id:            { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  vehicle_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle' },
  driver_id:           { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },

  predicted_duration_min: Number,
  actual_duration_min:    Number,
  predicted_fuel_l:       Number,
  actual_fuel_l:           Number,
  predicted_distance_km:   Number,
  actual_distance_km:      Number,

  eta_error_min:        Number,  // actual - predicted
  fuel_error_l:          Number,
  delay_min:              Number,

  customer_feedback_score: Number, // 1-5 if available
  driver_performance_score: Number,

  notes: String,
}, { timestamps: true });

routeLearningSchema.index({ company_id: 1, createdAt: -1 });
routeLearningSchema.index({ company_id: 1, vehicle_id: 1 });
routeLearningSchema.index({ company_id: 1, driver_id: 1 });

module.exports = mongoose.model('RouteLearning', routeLearningSchema);
