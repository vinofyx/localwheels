const mongoose = require('mongoose');

const vehicleHealthSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fleet_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  vehicle_number:   { type: String },

  score:      { type: Number, min: 0, max: 100, required: true },
  grade:      { type: String, enum: ['A','B','C','D','F'] },

  // Component sub-scores (0-100 each)
  components: {
    engine:      { type: Number, default: 100 },
    brakes:      { type: Number, default: 100 },
    tyres:       { type: Number, default: 100 },
    battery:     { type: Number, default: 100 },
    suspension:  { type: Number, default: 100 },
    body:        { type: Number, default: 100 },
    compliance:  { type: Number, default: 100 },
  },

  // AI analysis
  ai_summary:        { type: String },
  ai_recommendations:[{ type: String }],
  predicted_issues:  [{
    component:   { type: String },
    issue:       { type: String },
    probability: { type: Number },
    urgency:     { type: String, enum: ['low','medium','high','critical'] },
    estimated_days: { type: Number },
  }],

  factors: {
    maintenance_score:  { type: Number },
    age_penalty:        { type: Number },
    mileage_penalty:    { type: Number },
    breakdown_penalty:  { type: Number },
    compliance_bonus:   { type: Number },
  },

  assessed_at: { type: Date, default: Date.now },
}, { timestamps: true });

vehicleHealthSchema.index({ company_id: 1, fleet_vehicle_id: 1, assessed_at: -1 });
vehicleHealthSchema.index({ company_id: 1, score: 1 });

module.exports = mongoose.model('VehicleHealth', vehicleHealthSchema);
