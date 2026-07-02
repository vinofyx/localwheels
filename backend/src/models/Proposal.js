const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  lead_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  opportunity_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
  proposal_number:{ type: String, unique: true },

  title:          { type: String, required: true },
  customer_name:  { type: String, required: true },
  company_name:   { type: String },
  email:          { type: String },

  // Content (AI-generated)
  executive_summary: { type: String },
  services_offered:  [{ name: String, description: String, price: Number }],
  pricing_breakdown: { type: mongoose.Schema.Types.Mixed },
  total_value:       { type: Number, default: 0 },
  validity_days:     { type: Number, default: 30 },

  terms_conditions:  { type: String },
  key_differentiators:[{ type: String }],
  case_studies:      [{ title: String, summary: String }],

  // Linked quote
  quote_number: { type: String },

  status: { type: String, enum: ['draft','sent','viewed','accepted','rejected','expired'], default: 'draft' },
  sent_at:     { type: Date },
  viewed_at:   { type: Date },
  accepted_at: { type: Date },
  rejected_at: { type: Date },

  ai_generated:   { type: Boolean, default: false },
  ai_confidence:  { type: Number, min: 0, max: 100 },

  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

proposalSchema.index({ company_id: 1, status: 1 });

module.exports = mongoose.model('Proposal', proposalSchema);
