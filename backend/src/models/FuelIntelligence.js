const mongoose = require('mongoose');

const fuelEventSchema = new mongoose.Schema({
  event_type:    { type: String, enum: ['theft_suspected','unusual_drain','refuel','spike','drop'] },
  timestamp:     { type: Date },
  fuel_level_before: { type: Number },
  fuel_level_after:  { type: Number },
  delta_liters:  { type: Number },
  location:      { lat: Number, lng: Number },
  severity:      { type: String, enum: ['info','warning','critical'] },
  description:   { type: String },
}, { _id: false });

const fuelIntelligenceSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fleet_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  vehicle_number:   { type: String },

  // Period
  period_start:  { type: Date },
  period_end:    { type: Date },
  period_days:   { type: Number, default: 7 },

  // Consumption metrics
  total_fuel_consumed_l: { type: Number },
  total_distance_km:     { type: Number },
  avg_mileage_kmpl:      { type: Number },
  best_mileage_kmpl:     { type: Number },
  worst_mileage_kmpl:    { type: Number },
  expected_mileage_kmpl: { type: Number },
  efficiency_pct:        { type: Number }, // actual vs expected

  // Cost
  fuel_cost_per_km:   { type: Number },
  total_fuel_cost:    { type: Number },
  wasted_fuel_cost:   { type: Number },

  // Theft / Anomaly detection
  theft_risk:          { type: String, enum: ['none','low','medium','high'], default: 'none' },
  theft_events:        { type: Number, default: 0 },
  suspected_theft_liters: { type: Number, default: 0 },
  anomaly_events:      { type: Number, default: 0 },

  // Events log
  events: [fuelEventSchema],

  // Idle waste
  idle_fuel_consumed_l: { type: Number },
  idle_waste_pct:       { type: Number },

  // Route analysis
  best_route_mileage:   { type: Number },
  route_fuel_savings:   { type: Number },

  // AI
  ai_insights:     { type: String },
  recommendations: [{ type: String }],

  calculated_at: { type: Date, default: Date.now },
}, { timestamps: true });

fuelIntelligenceSchema.index({ company_id: 1, fleet_vehicle_id: 1, calculated_at: -1 });
fuelIntelligenceSchema.index({ company_id: 1, theft_risk: 1 });

module.exports = mongoose.model('FuelIntelligence', fuelIntelligenceSchema);
