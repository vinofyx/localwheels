const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  lead_number:  { type: String, unique: true },

  // Contact info
  name:         { type: String, required: true, trim: true },
  company_name: { type: String, trim: true },
  email:        { type: String, trim: true, lowercase: true },
  phone:        { type: String, trim: true },
  designation:  { type: String, trim: true },

  // Source & stage
  source: {
    type: String,
    enum: ['website','whatsapp','facebook','instagram','google_ads','referral','sales_team','manual_entry'],
    default: 'manual_entry',
  },
  stage: {
    type: String,
    enum: ['new_lead','qualified','contacted','meeting_scheduled','proposal_sent','negotiation','won','lost'],
    default: 'new_lead',
  },

  // Assignment
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Business details
  estimated_value:   { type: Number, default: 0 },
  probability:       { type: Number, min: 0, max: 100, default: 10 },
  origin_city:       { type: String },
  destination_city:  { type: String },
  cargo_type:        { type: String },
  weight_tons:       { type: Number },
  frequency:         { type: String, enum: ['one_time','weekly','monthly','quarterly','annual'], default: 'one_time' },
  service_type:      { type: String, enum: ['ftl','ltl','express','part_load','courier'], default: 'ftl' },

  // AI fields
  ai_score:          { type: Number, min: 0, max: 100, default: 0 },
  ai_qualification:  { type: String },
  ai_next_action:    { type: String },
  ai_win_probability:{ type: Number, min: 0, max: 100 },
  ai_sentiment:      { type: String, enum: ['positive','neutral','negative'] },

  // Tracking
  notes:            { type: String },
  tags:             [{ type: String }],
  lost_reason:      { type: String },
  won_date:         { type: Date },
  lost_date:        { type: Date },
  last_contacted_at:{ type: Date },
  next_followup_at: { type: Date },
  converted_to_opportunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },

  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

leadSchema.index({ company_id: 1, stage: 1 });
leadSchema.index({ company_id: 1, assigned_to: 1 });
leadSchema.index({ company_id: 1, next_followup_at: 1 });
leadSchema.index({ phone: 1 });

module.exports = mongoose.model('Lead', leadSchema);
