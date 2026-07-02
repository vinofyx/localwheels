const mongoose = require('mongoose');

// Full timeline / audit log for a complaint
const complaintActivitySchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  complaint_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },

  actor_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actor_name:  { type: String },
  actor_role:  { type: String, enum: ['customer','agent','supervisor','system','ai'] },

  action: {
    type: String,
    enum: [
      'created','status_changed','priority_changed','assigned','reassigned',
      'comment_added','internal_note','escalated','resolved','closed',
      'reopened','attachment_added','ai_classified','sla_breach','sla_escalated',
      'feedback_submitted','department_changed','merged','rejected',
    ],
    required: true,
  },
  is_internal: { type: Boolean, default: false }, // internal notes not visible to customer
  comment:     { type: String },

  // Change tracking
  from_value: { type: String },
  to_value:   { type: String },
  field_changed: { type: String },

  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

complaintActivitySchema.index({ company_id: 1, complaint_id: 1, createdAt: 1 });

module.exports = mongoose.model('ComplaintActivity', complaintActivitySchema);
