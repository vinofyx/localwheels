const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  type:            { type: String, enum: ['alternative_route','alternative_vehicle','alternative_driver','alternative_warehouse','alternative_supplier','alternative_carrier','dynamic_eta','cost_optimization','capacity_optimization','delivery_optimization','risk_mitigation','other'], default: 'other' },
  priority:        { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  status:          { type: String, enum: ['pending','accepted','rejected','implemented','expired'], default: 'pending' },
  title:           { type: String, required: true },
  problem:         String,
  recommendation:  String,
  rationale:       String,
  expected_saving: { type: Number, default: 0 },
  expected_benefit:String,
  confidence_pct:  { type: Number, default: 0 },
  entity_type:     String,
  entity_id:       mongoose.Schema.Types.ObjectId,
  entity_ref:      String,
  options:         [{ label: String, description: String, score: Number }],
  selected_option: String,
  accepted_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  accepted_at:     Date,
  expires_at:      Date,
  ai_model:        String,
}, { timestamps: true });
s.index({ company_id: 1, status: 1, createdAt: -1 });
module.exports = mongoose.model('DecisionRecommendation', s);
