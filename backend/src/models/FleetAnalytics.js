const mongoose = require('mongoose');

// Daily/weekly analytics snapshot per company (pre-aggregated for fast reads)
const fleetAnalyticsSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  period:        { type: String, enum: ['daily','weekly','monthly'], default: 'daily' },
  period_date:   { type: Date, required: true }, // day/week/month start

  // Fleet counts
  total_vehicles:     { type: Number, default: 0 },
  available_vehicles: { type: Number, default: 0 },
  on_trip_vehicles:   { type: Number, default: 0 },
  maintenance_vehicles:{ type: Number, default: 0 },
  idle_vehicles:      { type: Number, default: 0 },
  breakdown_vehicles: { type: Number, default: 0 },

  // Utilization
  fleet_utilization_pct: { type: Number, default: 0 },
  avg_trips_per_vehicle: { type: Number, default: 0 },

  // Financials
  total_fuel_cost:     { type: Number, default: 0 },
  total_maintenance_cost:{ type: Number, default: 0 },
  total_expenses:      { type: Number, default: 0 },
  total_revenue:       { type: Number, default: 0 },
  total_km:            { type: Number, default: 0 },
  avg_cost_per_km:     { type: Number, default: 0 },

  // Health
  avg_health_score:    { type: Number, default: 0 },
  vehicles_needing_maintenance: { type: Number, default: 0 },

  computed_at: { type: Date, default: Date.now },
}, { timestamps: true });

fleetAnalyticsSchema.index({ company_id: 1, period: 1, period_date: -1 }, { unique: true });

module.exports = mongoose.model('FleetAnalytics', fleetAnalyticsSchema);
