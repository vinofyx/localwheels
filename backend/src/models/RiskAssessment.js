const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  risk_type:     { type: String, enum: ['weather','traffic','political','route_closure','vehicle_breakdown','supplier','warehouse','driver','delivery','financial','cyber','compliance','other'], default: 'other' },
  severity:      { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  probability:   { type: String, enum: ['unlikely','possible','likely','almost_certain'], default: 'possible' },
  risk_score:    { type: Number, min: 0, max: 100, default: 0 },
  title:         { type: String, required: true },
  description:   String,
  affected_area: String,
  entity_type:   String,
  entity_id:     mongoose.Schema.Types.ObjectId,
  entity_ref:    String,
  mitigation:    String,
  status:        { type: String, enum: ['active','monitoring','mitigated','accepted','closed'], default: 'active' },
  ai_generated:  { type: Boolean, default: false },
  ai_confidence: { type: Number, default: 0 },
  valid_until:   Date,
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
s.index({ company_id: 1, status: 1, risk_score: -1 });
module.exports = mongoose.model('RiskAssessment', s);
