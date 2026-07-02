const mongoose = require('mongoose');

const dispatchApprovalSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  dispatch_plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchPlan', required: true },

  reason:            { type: String, enum: ['high_value','high_risk','exception','manual_request'], required: true },
  value_amount:        Number,
  risk_notes:           String,

  requested_by:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requested_by_name:        String,
  status:                     { type: String, enum: ['pending','approved','rejected'], default: 'pending' },

  reviewed_by:                { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewed_by_name:             String,
  reviewed_at:                   Date,
  review_comment:                  String,
}, { timestamps: true });

dispatchApprovalSchema.index({ company_id: 1, status: 1 });
dispatchApprovalSchema.index({ company_id: 1, dispatch_plan_id: 1 });

module.exports = mongoose.model('DispatchApproval', dispatchApprovalSchema);
