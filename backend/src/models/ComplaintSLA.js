const mongoose = require('mongoose');

// SLA configuration per company / per priority
const complaintSLASchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

  priority: {
    type: String,
    enum: ['Critical','High','Medium','Low'],
    required: true,
  },

  response_sla_hours:   { type: Number, required: true }, // first response
  resolution_sla_hours: { type: Number, required: true }, // full resolution

  // Escalation chain (hours after breach)
  escalate_after_hours: { type: Number, default: 1 },
  escalate_to_role:     { type: String, default: 'supervisor' },

  is_active: { type: Boolean, default: true },
  updated_by:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

complaintSLASchema.index({ company_id: 1, priority: 1 }, { unique: true });

module.exports = mongoose.model('ComplaintSLA', complaintSLASchema);
