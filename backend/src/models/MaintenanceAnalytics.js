const mongoose = require('mongoose');

const maintenanceAnalyticsSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  period:     { type: String, enum: ['daily','weekly','monthly'], default: 'monthly' },
  period_date:{ type: Date, required: true },

  // Fleet health
  fleet_health_score:     { type: Number, min: 0, max: 100 },
  vehicles_total:         { type: Number },
  vehicles_healthy:       { type: Number },
  vehicles_at_risk:       { type: Number },
  vehicles_critical:      { type: Number },
  vehicles_in_maintenance:{ type: Number },

  // Maintenance activity
  work_orders_total:      { type: Number, default: 0 },
  work_orders_completed:  { type: Number, default: 0 },
  work_orders_open:       { type: Number, default: 0 },
  work_orders_overdue:    { type: Number, default: 0 },
  avg_turnaround_hrs:     { type: Number },
  maintenance_compliance_pct: { type: Number },

  // Cost
  total_maintenance_cost: { type: Number, default: 0 },
  labour_cost:            { type: Number, default: 0 },
  parts_cost:             { type: Number, default: 0 },
  avg_cost_per_vehicle:   { type: Number },
  cost_savings_predicted: { type: Number }, // by predictive vs reactive

  // Predictions
  predictions_generated:  { type: Number, default: 0 },
  predictions_actioned:   { type: Number, default: 0 },
  predictions_accuracy_pct:{ type: Number },
  critical_alerts:        { type: Number, default: 0 },

  // Fuel
  avg_fleet_mileage_kmpl: { type: Number },
  fuel_theft_events:      { type: Number, default: 0 },
  fuel_waste_liters:      { type: Number, default: 0 },

  // Driver
  avg_driver_score:       { type: Number },
  drivers_coached:        { type: Number, default: 0 },

  // Downtime
  total_downtime_hrs:     { type: Number, default: 0 },
  planned_downtime_pct:   { type: Number },
  uptime_pct:             { type: Number },

  // AI
  ai_summary:     { type: String },
  top_issues:     [{ type: String }],
  recommendations:[{ type: String }],

  snapshot_at: { type: Date, default: Date.now },
}, { timestamps: true });

maintenanceAnalyticsSchema.index({ company_id: 1, period: 1, period_date: -1 });
maintenanceAnalyticsSchema.index({ company_id: 1, period_date: -1 });

module.exports = mongoose.model('MaintenanceAnalytics', maintenanceAnalyticsSchema);
