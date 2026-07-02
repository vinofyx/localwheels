const mongoose = require('mongoose');

const dispatcherPerformanceSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  dispatcher_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dispatcher_name:  { type: String, required: true },

  period:              { type: String, enum: ['daily','weekly','monthly'], default: 'daily' },
  period_date:           { type: Date, required: true },

  plans_created:           { type: Number, default: 0 },
  plans_approved:            { type: Number, default: 0 },
  avg_planning_time_min:       { type: Number, default: 0 },
  avg_approval_time_min:         { type: Number, default: 0 },
  sla_compliant_count:             { type: Number, default: 0 },
  sla_breached_count:                { type: Number, default: 0 },
  trips_managed:                       { type: Number, default: 0 },
  exceptions_handled:                    { type: Number, default: 0 },
}, { timestamps: true });

dispatcherPerformanceSchema.index({ company_id: 1, dispatcher_id: 1, period: 1, period_date: -1 }, { unique: true });

module.exports = mongoose.model('DispatcherPerformance', dispatcherPerformanceSchema);
