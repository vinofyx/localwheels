const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  snapshot_date: { type: Date, required: true },
  period:      { type: String, enum: ['daily','weekly','monthly'], default: 'daily' },

  // Revenue KPIs
  revenue_today:    { type: Number, default: 0 },
  revenue_month:    { type: Number, default: 0 },
  revenue_quarter:  { type: Number, default: 0 },
  revenue_year:     { type: Number, default: 0 },
  profit_month:     { type: Number, default: 0 },
  expenses_month:   { type: Number, default: 0 },

  // Shipment KPIs
  shipments_today:  { type: Number, default: 0 },
  shipments_month:  { type: Number, default: 0 },
  delivered_today:  { type: Number, default: 0 },
  delayed_today:    { type: Number, default: 0 },
  pending_today:    { type: Number, default: 0 },
  on_time_pct:      { type: Number, default: 0 },

  // Fleet KPIs
  fleet_total:      { type: Number, default: 0 },
  fleet_active:     { type: Number, default: 0 },
  fleet_utilization_pct: { type: Number, default: 0 },
  fleet_health_score:    { type: Number, default: 0 },

  // Driver KPIs
  drivers_total:    { type: Number, default: 0 },
  drivers_active:   { type: Number, default: 0 },
  driver_utilization_pct: { type: Number, default: 0 },

  // Customer KPIs
  active_customers: { type: Number, default: 0 },
  new_customers_month: { type: Number, default: 0 },
  customer_satisfaction: { type: Number, default: 0 },

  // Operations KPIs
  complaints_open:  { type: Number, default: 0 },
  complaints_resolved_today: { type: Number, default: 0 },
  sla_breach_count: { type: Number, default: 0 },

  // Sales KPIs
  leads_month:      { type: Number, default: 0 },
  quote_conversion_pct: { type: Number, default: 0 },
  sales_revenue_month:  { type: Number, default: 0 },

  // Document KPIs
  docs_processed_today: { type: Number, default: 0 },
  docs_pending_approval: { type: Number, default: 0 },
  ocr_accuracy_pct:   { type: Number, default: 0 },

  // Alerts
  critical_alerts:  { type: Number, default: 0 },
  warning_alerts:   { type: Number, default: 0 },

}, { timestamps: true });

schema.index({ company_id: 1, period: 1, snapshot_date: -1 }, { unique: true });
module.exports = mongoose.model('ExecutiveDashboard', schema);
