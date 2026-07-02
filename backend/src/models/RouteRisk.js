const mongoose = require('mongoose');

const routeRiskSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  route_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'OptimizedRoute' },

  traffic_risk:      { type: Number, default: 0 }, // 0-100
  weather_risk:        { type: Number, default: 0 },
  road_quality_risk:    { type: Number, default: 0 },
  incident_history_risk: { type: Number, default: 0 },
  crime_zone_risk:        { type: Number, default: 0 },

  overall_risk_score:      { type: Number, required: true }, // 0-100
  risk_level:               { type: String, enum: ['low','medium','high','critical'], required: true },
  contributing_factors:      [String],
  ai_confidence:               { type: Number, default: 70 },
  ai_reasoning:                 String,
}, { timestamps: true });

routeRiskSchema.index({ company_id: 1, route_id: 1 });
routeRiskSchema.index({ company_id: 1, createdAt: -1 });

module.exports = mongoose.model('RouteRisk', routeRiskSchema);
