const mongoose = require('mongoose');

const driverBehaviourSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  driver_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  driver_name: { type: String },
  vehicle_number: { type: String },
  fleet_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle' },

  // Period
  period_start: { type: Date, required: true },
  period_end:   { type: Date, required: true },
  period_type:  { type: String, enum: ['trip','daily','weekly','monthly'], default: 'daily' },

  // Scores (0-100)
  overall_score:    { type: Number, min: 0, max: 100 },
  safety_score:     { type: Number, min: 0, max: 100 },
  eco_score:        { type: Number, min: 0, max: 100 },
  compliance_score: { type: Number, min: 0, max: 100 },

  // Grade
  grade: { type: String, enum: ['A+','A','B','C','D','F'], default: 'B' },

  // Events
  events: {
    harsh_braking:        { type: Number, default: 0 },
    harsh_acceleration:   { type: Number, default: 0 },
    harsh_turning:        { type: Number, default: 0 },
    speeding_events:      { type: Number, default: 0 },
    speed_limit_violations:{ type: Number, default: 0 },
    idle_events:          { type: Number, default: 0 },
    distraction_events:   { type: Number, default: 0 },
    fatigue_events:       { type: Number, default: 0 },
    sos_events:           { type: Number, default: 0 },
  },

  // Metrics
  metrics: {
    total_distance_km:  { type: Number },
    total_drive_time_min:{ type: Number },
    avg_speed_kmh:      { type: Number },
    max_speed_kmh:      { type: Number },
    idle_time_min:      { type: Number },
    idle_pct:           { type: Number },
    night_driving_min:  { type: Number },
    trips_count:        { type: Number },
  },

  // Trend
  score_trend:   { type: String, enum: ['improving','stable','declining'], default: 'stable' },
  score_change:  { type: Number }, // vs previous period

  // AI coaching
  ai_coaching:   { type: String },
  strengths:     [{ type: String }],
  improvements:  [{ type: String }],
  coaching_sent: { type: Boolean, default: false },
}, { timestamps: true });

driverBehaviourSchema.index({ company_id: 1, driver_id: 1, period_start: -1 });
driverBehaviourSchema.index({ company_id: 1, overall_score: 1 });
driverBehaviourSchema.index({ company_id: 1, period_type: 1, period_start: -1 });

module.exports = mongoose.model('DriverBehaviour', driverBehaviourSchema);
