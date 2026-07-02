const mongoose = require('mongoose');

const salesTaskSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  lead_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  opportunity_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },

  title:      { type: String, required: true, trim: true },
  description:{ type: String },
  type: {
    type: String,
    enum: ['call','email','whatsapp','meeting','follow_up','send_proposal','send_quote','demo','task'],
    default: 'follow_up',
  },
  priority:   { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
  status:     { type: String, enum: ['pending','in_progress','completed','cancelled'], default: 'pending' },

  due_date:     { type: Date },
  completed_at: { type: Date },
  reminder_at:  { type: Date },

  assigned_to:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  ai_suggested: { type: Boolean, default: false },
  ai_reason:    { type: String },
}, { timestamps: true });

salesTaskSchema.index({ company_id: 1, status: 1, due_date: 1 });
salesTaskSchema.index({ company_id: 1, assigned_to: 1, status: 1 });

module.exports = mongoose.model('SalesTask', salesTaskSchema);
