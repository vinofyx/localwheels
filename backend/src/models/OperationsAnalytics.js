const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  period:      { type: String, enum: ['daily','weekly','monthly'], default: 'daily' },
  period_date: { type: Date, required: true },

  shipments_total:  { type: Number, default: 0 },
  shipments_delivered: { type: Number, default: 0 },
  shipments_delayed:   { type: Number, default: 0 },
  shipments_cancelled: { type: Number, default: 0 },
  on_time_delivery_pct: { type: Number, default: 0 },
  avg_delivery_time_hrs: { type: Number, default: 0 },

  dispatch_efficiency_pct: { type: Number, default: 0 },
  route_efficiency_pct:    { type: Number, default: 0 },
  load_factor_pct:         { type: Number, default: 0 },

  fleet_utilization_pct:  { type: Number, default: 0 },
  driver_utilization_pct: { type: Number, default: 0 },

  complaints_opened:  { type: Number, default: 0 },
  complaints_closed:  { type: Number, default: 0 },
  avg_resolution_hrs: { type: Number, default: 0 },
  sla_compliance_pct: { type: Number, default: 0 },

  delay_reasons: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

schema.index({ company_id: 1, period: 1, period_date: -1 }, { unique: true });
module.exports = mongoose.model('OperationsAnalytics', schema);
