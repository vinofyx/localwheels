const mongoose = require('mongoose');

const tyrePositionSchema = new mongoose.Schema({
  position:       { type: String, enum: ['FL','FR','RL','RR','spare'], required: true },
  pressure_psi:   { type: Number },
  temperature:    { type: Number }, // °C
  tread_depth_mm: { type: Number },
  health_pct:     { type: Number, min: 0, max: 100 },
  status:         { type: String, enum: ['good','low_pressure','high_temp','worn','critical','flat'], default: 'good' },
  installed_date: { type: Date },
  brand:          { type: String },
  model:          { type: String },
  size:           { type: String },
  km_at_install:  { type: Number },
  predicted_replacement_km: { type: Number },
  predicted_replacement_date: { type: Date },
}, { _id: false });

const tyreHealthSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fleet_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  vehicle_number:   { type: String },

  // Overall fleet score
  overall_health_pct: { type: Number, min: 0, max: 100 },
  critical_tyres:     { type: Number, default: 0 },

  // Per-tyre breakdown
  tyres: [tyrePositionSchema],

  // Maintenance
  last_rotation_date: { type: Date },
  last_rotation_km:   { type: Number },
  next_rotation_km:   { type: Number },
  alignment_due:      { type: Boolean, default: false },
  balancing_due:      { type: Boolean, default: false },

  // AI
  ai_recommendation:   { type: String },
  urgent_action_needed:{ type: Boolean, default: false },

  assessed_at: { type: Date, default: Date.now },
}, { timestamps: true });

tyreHealthSchema.index({ company_id: 1, fleet_vehicle_id: 1, assessed_at: -1 });
tyreHealthSchema.index({ company_id: 1, critical_tyres: -1 });

module.exports = mongoose.model('TyreHealth', tyreHealthSchema);
