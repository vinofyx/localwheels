const mongoose = require('mongoose');

// Customer satisfaction survey after resolution
const complaintFeedbackSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  complaint_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true, unique: true },

  customer_name:  { type: String },
  customer_phone: { type: String },

  // CSAT score 1-5
  rating:         { type: Number, min: 1, max: 5, required: true },
  comment:        { type: String },

  // Specific dimensions
  response_speed_rating:   { type: Number, min: 1, max: 5 },
  resolution_quality_rating:{ type: Number, min: 1, max: 5 },
  agent_courtesy_rating:   { type: Number, min: 1, max: 5 },

  would_recommend:   { type: Boolean },
  is_repeat_issue:   { type: Boolean },

  // AI sentiment on feedback itself
  feedback_sentiment: { type: String, enum: ['positive','neutral','negative'] },

  submitted_via: { type: String, enum: ['web','sms','whatsapp','email','ivr'], default: 'web' },
}, { timestamps: true });

complaintFeedbackSchema.index({ company_id: 1, createdAt: -1 });

module.exports = mongoose.model('ComplaintFeedback', complaintFeedbackSchema);
