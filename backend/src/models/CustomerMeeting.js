const mongoose = require('mongoose');

const customerMeetingSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  lead_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  opportunity_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },

  title:          { type: String, required: true, trim: true },
  meeting_type:   { type: String, enum: ['call','video','in_person','demo','follow_up'], default: 'call' },
  status:         { type: String, enum: ['scheduled','completed','cancelled','no_show'], default: 'scheduled' },

  scheduled_at:   { type: Date, required: true },
  duration_min:   { type: Number, default: 30 },
  location:       { type: String },
  meeting_link:   { type: String },

  attendees:      [{ name: String, email: String, phone: String }],
  agenda:         { type: String },
  notes:          { type: String },
  outcome:        { type: String },
  next_steps:     { type: String },

  // AI
  ai_summary:     { type: String },
  ai_action_items:[{ type: String }],
  ai_sentiment:   { type: String, enum: ['positive','neutral','negative'] },

  followup_date:  { type: Date },
  reminder_sent:  { type: Boolean, default: false },

  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

customerMeetingSchema.index({ company_id: 1, scheduled_at: 1 });
customerMeetingSchema.index({ company_id: 1, status: 1 });

module.exports = mongoose.model('CustomerMeeting', customerMeetingSchema);
