const mongoose = require('mongoose');

const dispatchAnalyticsSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  period:      { type: String, enum: ['daily','weekly','monthly'], default: 'daily' },
  period_date: { type: Date, required: true },

  // Volume
  total_dispatches:    { type: Number, default: 0 },
  total_shipments:     { type: Number, default: 0 },
  total_trips:         { type: Number, default: 0 },
  cancelled_dispatches:{ type: Number, default: 0 },

  // Performance
  avg_dispatch_time_min:  { type: Number },
  avg_loading_time_min:   { type: Number },
  avg_trip_duration_min:  { type: Number },
  on_time_dispatches:     { type: Number, default: 0 },
  delayed_dispatches:     { type: Number, default: 0 },
  sla_compliance_pct:     { type: Number, default: 0 },

  // AI performance
  ai_plans_generated:   { type: Number, default: 0 },
  ai_plans_accepted:    { type: Number, default: 0 },
  ai_plans_overridden:  { type: Number, default: 0 },
  avg_ai_confidence:    { type: Number },

  // Exceptions
  total_exceptions:     { type: Number, default: 0 },
  exceptions_resolved:  { type: Number, default: 0 },

  // Cost
  total_fuel_cost:      { type: Number, default: 0 },
  total_trip_cost:      { type: Number, default: 0 },
  avg_cost_per_shipment:{ type: Number, default: 0 },

  computed_at: { type: Date, default: Date.now },
}, { timestamps: true });

dispatchAnalyticsSchema.index({ company_id: 1, period: 1, period_date: -1 }, { unique: true });

module.exports = mongoose.model('DispatchAnalytics', dispatchAnalyticsSchema);
