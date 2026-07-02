const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  lead_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  opp_number:   { type: String, unique: true },

  title:        { type: String, required: true, trim: true },
  customer_name:{ type: String, required: true, trim: true },
  company_name: { type: String, trim: true },
  email:        { type: String, trim: true },
  phone:        { type: String, trim: true },

  stage: {
    type: String,
    enum: ['new_lead','qualified','contacted','meeting_scheduled','proposal_sent','negotiation','won','lost'],
    default: 'qualified',
  },

  estimated_value:   { type: Number, default: 0 },
  probability:       { type: Number, min: 0, max: 100, default: 20 },
  expected_close_date: { type: Date },
  actual_close_date:   { type: Date },

  service_type: { type: String, enum: ['ftl','ltl','express','part_load','courier'], default: 'ftl' },
  origin:       { type: String },
  destination:  { type: String },
  cargo_type:   { type: String },
  weight_tons:  { type: Number },
  frequency:    { type: String, enum: ['one_time','weekly','monthly','quarterly','annual'], default: 'one_time' },

  // Linked records
  quote_number:    { type: String },
  proposal_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' },

  // AI
  ai_score:          { type: Number, min: 0, max: 100 },
  ai_win_probability:{ type: Number, min: 0, max: 100 },
  ai_next_action:    { type: String },
  ai_risk_factors:   [{ type: String }],

  notes:       { type: String },
  lost_reason: { type: String },
  tags:        [{ type: String }],

  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

opportunitySchema.index({ company_id: 1, stage: 1 });
opportunitySchema.index({ company_id: 1, assigned_to: 1 });
opportunitySchema.index({ company_id: 1, expected_close_date: 1 });

module.exports = mongoose.model('Opportunity', opportunitySchema);
