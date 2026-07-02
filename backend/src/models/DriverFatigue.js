const mongoose = require('mongoose');

const driverFatigueSchema = new mongoose.Schema({
  company_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  driver_id:           { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },

  period_date:         { type: Date, required: true }, // day this snapshot covers
  hours_driven_today:  { type: Number, default: 0 },
  hours_driven_week:    { type: Number, default: 0 },
  continuous_hours:      { type: Number, default: 0 }, // since last rest break
  last_rest_at:           Date,
  last_trip_end_at:        Date,

  is_fatigued:          { type: Boolean, default: false },
  fatigue_reason:        { type: String, enum: ['exceeded_daily_limit','exceeded_weekly_limit','insufficient_rest','continuous_driving', null], default: null },
  is_overtime:           { type: Boolean, default: false },
  is_eligible_for_assignment: { type: Boolean, default: true },
}, { timestamps: true });

driverFatigueSchema.index({ company_id: 1, driver_id: 1, period_date: -1 });

module.exports = mongoose.model('DriverFatigue', driverFatigueSchema);
