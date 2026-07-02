const mongoose = require('mongoose');

const engineHealthSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fleet_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  vehicle_number:   { type: String },

  // Composite score
  engine_score:       { type: Number, min: 0, max: 100 },
  health_status:      { type: String, enum: ['excellent','good','fair','poor','critical'], default: 'good' },

  // Current readings (from last telemetry)
  current: {
    rpm:             { type: Number },
    coolant_temp:    { type: Number },
    oil_pressure:    { type: Number },
    oil_temp:        { type: Number },
    engine_load:     { type: Number },
    throttle_pos:    { type: Number },
    intake_air_temp: { type: Number },
  },

  // Trend analysis (7-day averages)
  averages: {
    avg_rpm:          { type: Number },
    avg_coolant_temp: { type: Number },
    avg_load:         { type: Number },
    max_rpm:          { type: Number },
    max_coolant_temp: { type: Number },
    high_rpm_pct:     { type: Number }, // % time above 3500 RPM
    overtemp_events:  { type: Number },
  },

  // Usage
  total_engine_hours:    { type: Number },
  total_idle_hours:      { type: Number },
  idle_ratio_pct:        { type: Number },
  oil_life_remaining_pct:{ type: Number },
  last_oil_change_date:  { type: Date },
  last_oil_change_km:    { type: Number },

  // DTC
  active_dtc_codes:   [{ type: String }],
  dtc_history_count:  { type: Number, default: 0 },

  // AI
  ai_analysis:         { type: String },
  predicted_issues:    [{ type: String }],
  next_service_due_km: { type: Number },
  next_service_due_date: { type: Date },

  assessed_at: { type: Date, default: Date.now },
}, { timestamps: true });

engineHealthSchema.index({ company_id: 1, fleet_vehicle_id: 1, assessed_at: -1 });
engineHealthSchema.index({ company_id: 1, engine_score: 1 });

module.exports = mongoose.model('EngineHealth', engineHealthSchema);
