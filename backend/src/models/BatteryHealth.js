const mongoose = require('mongoose');

const batteryHealthSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fleet_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  vehicle_number:   { type: String },

  // Health
  health_pct:       { type: Number, min: 0, max: 100 },
  health_status:    { type: String, enum: ['excellent','good','fair','replace_soon','replace_now'], default: 'good' },
  soh:              { type: Number }, // State of Health %
  soc:              { type: Number }, // State of Charge %

  // Current readings
  voltage_current:  { type: Number }, // V
  current_amps:     { type: Number }, // A
  temperature:      { type: Number }, // °C
  charging_status:  { type: String, enum: ['charging','discharging','idle','fault'] },
  alternator_output:{ type: Number }, // V

  // Trends (7-day)
  avg_voltage:      { type: Number },
  min_voltage:      { type: Number },
  max_voltage:      { type: Number },
  voltage_drop_events: { type: Number },
  low_voltage_events:  { type: Number },

  // Lifecycle
  estimated_age_months:      { type: Number },
  estimated_remaining_months:{ type: Number },
  replacement_date_prediction:{ type: Date },
  last_replaced_date:        { type: Date },
  charging_cycles:           { type: Number },

  // AI
  ai_recommendation:  { type: String },
  replacement_urgency:{ type: String, enum: ['none','monitor','plan','urgent','immediate'], default: 'none' },

  assessed_at: { type: Date, default: Date.now },
}, { timestamps: true });

batteryHealthSchema.index({ company_id: 1, fleet_vehicle_id: 1, assessed_at: -1 });
batteryHealthSchema.index({ company_id: 1, health_status: 1 });

module.exports = mongoose.model('BatteryHealth', batteryHealthSchema);
