const mongoose = require('mongoose');

// Detailed resolution record created when a complaint is resolved
const complaintResolutionSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  complaint_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true, unique: true },

  resolved_by:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolver_name:     { type: String },
  department:        { type: String },

  root_cause:        { type: String },
  resolution_action: { type: String, required: true },
  resolution_type: {
    type: String,
    enum: ['refund','replacement','apology','investigation','process_fix','no_action','other'],
    default: 'other',
  },

  // Compensation / action taken
  compensation_offered: { type: Boolean, default: false },
  compensation_amount:  { type: Number },
  compensation_type:    { type: String }, // credit, refund, voucher

  // AI contribution
  ai_suggested:   { type: Boolean, default: false },
  ai_suggestion:  { type: String },

  knowledge_article_id: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeArticle' },

  follow_up_required: { type: Boolean, default: false },
  follow_up_date:     { type: Date },
  notes:              { type: String },
}, { timestamps: true });

complaintResolutionSchema.index({ company_id: 1, complaint_id: 1 });

module.exports = mongoose.model('ComplaintResolution', complaintResolutionSchema);
