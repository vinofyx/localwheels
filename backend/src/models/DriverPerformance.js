const mongoose = require('mongoose');

const driverPerformanceSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  driver_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  period:     { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'monthly' },
  period_date:{ type: Date, required: true },

  trips_assigned:  { type: Number, default: 0 },
  trips_completed: { type: Number, default: 0 },
  trips_cancelled: { type: Number, default: 0 },
  on_time_deliveries: { type: Number, default: 0 },
  late_deliveries:    { type: Number, default: 0 },

  total_distance_km:  { type: Number, default: 0 },
  total_hours:        { type: Number, default: 0 },
  avg_speed_kmh:      { type: Number, default: 0 },
  idle_time_min:      { type: Number, default: 0 },
  fuel_consumed_l:    { type: Number, default: 0 },
  fuel_efficiency_kmpl:{ type: Number, default: 0 },

  incidents_total:   { type: Number, default: 0 },
  incidents_breakdown:{ type: Number, default: 0 },
  incidents_accident: { type: Number, default: 0 },

  customer_rating:   { type: Number, min: 0, max: 5, default: 0 },
  rating_count:      { type: Number, default: 0 },

  on_time_pct:       { type: Number, default: 0 },
  completion_rate:   { type: Number, default: 0 },
  safety_score:      { type: Number, min: 0, max: 100, default: 0 },
  compliance_score:  { type: Number, min: 0, max: 100, default: 0 },
  overall_score:     { type: Number, min: 0, max: 100, default: 0 },

  ai_feedback:       { type: String },
  ai_improvements:   [{ type: String }],
}, { timestamps: true });

driverPerformanceSchema.index({ company_id: 1, driver_id: 1, period: 1, period_date: -1 }, { unique: true });

module.exports = mongoose.model('DriverPerformance', driverPerformanceSchema);
