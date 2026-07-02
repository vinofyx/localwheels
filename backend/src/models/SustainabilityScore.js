const mongoose = require('mongoose');

const sustainabilityScoreSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  score_date:   { type: Date, required: true },
  period_type:  { type: String, enum: ['daily','weekly','monthly','quarterly','annual'], default: 'monthly' },
  overall_score:{ type: Number, default: 0, min: 0, max: 100 },
  carbon_score: { type: Number, default: 0, min: 0, max: 100 },
  fuel_score:   { type: Number, default: 0, min: 0, max: 100 },
  route_score:  { type: Number, default: 0, min: 0, max: 100 },
  fleet_score:  { type: Number, default: 0, min: 0, max: 100 },
  total_co2_kg: { type: Number, default: 0 },
  co2_per_km:   { type: Number, default: 0 },
  co2_reduction_pct: { type: Number, default: 0 },
  fuel_efficiency: { type: Number, default: 0 },
  ev_fleet_pct: { type: Number, default: 0 },
  green_trips_pct: { type: Number, default: 0 },
  targets: [{
    metric: String, target: Number, actual: Number, unit: String, achieved: Boolean,
  }],
  recommendations: [String],
  grade: { type: String, enum: ['A+','A','B+','B','C','D','F'], default: 'C' },
}, { timestamps: true });

sustainabilityScoreSchema.index({ company_id: 1, score_date: -1 });
module.exports = mongoose.model('SustainabilityScore', sustainabilityScoreSchema);
