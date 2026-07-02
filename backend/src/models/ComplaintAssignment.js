const mongoose = require('mongoose');

// History of every assignment change for a complaint
const complaintAssignmentSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  complaint_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },

  assigned_to:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assigned_name: { type: String },
  assigned_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department:    { type: String },
  reason:        { type: String },
  is_ai_assigned:{ type: Boolean, default: false },

  // When the agent started / finished working on it
  accepted_at:   { type: Date },
  released_at:   { type: Date },
  release_reason:{ type: String },
}, { timestamps: true });

complaintAssignmentSchema.index({ company_id: 1, complaint_id: 1 });
complaintAssignmentSchema.index({ company_id: 1, assigned_to: 1 });

module.exports = mongoose.model('ComplaintAssignment', complaintAssignmentSchema);
