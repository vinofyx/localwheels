const mongoose = require('mongoose');

const operationalRiskSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  title:        { type: String, required: true },
  description:  { type: String },
  risk_type:    { type: String, enum: ['operational','financial','supply_chain','weather','regulatory','cyber','reputational','fleet','driver','warehouse','fleet_breakdown','weather_disruption','supplier_failure','demand_shock','cybersecurity','fuel_price','staff_shortage','route_blockage','warehouse_fire','natural_disaster','custom'], required: true },
  category:     { type: String },
  severity:     { type: String, enum: ['critical','high','medium','low'], default: 'medium' },
  likelihood:   { type: String, enum: ['very_high','high','medium','low','very_low'], default: 'medium' },
  risk_score:   { type: Number, default: 0, min: 0, max: 100 },
  status:       { type: String, enum: ['identified','assessed','mitigating','mitigated','accepted','closed'], default: 'identified' },
  impact_areas: [String],
  financial_exposure: { type: Number, default: 0 },
  mitigation_actions: [{ action: String, owner: String, due_date: Date, status: String }],
  simulation_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Simulation' },
  detected_at:  { type: Date, default: Date.now },
  mitigated_at: { type: Date },
  owner_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags:         [String],
}, { timestamps: true });

operationalRiskSchema.index({ company_id: 1, severity: 1, status: 1 });
module.exports = mongoose.model('OperationalRisk', operationalRiskSchema);
