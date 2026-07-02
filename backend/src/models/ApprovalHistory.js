const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjId = Schema.Types.ObjectId;

const approvalHistorySchema = new Schema({
  company_id:     { type: ObjId, ref: 'Company', required: true, index: true },
  request_id:     { type: ObjId, ref: 'ApprovalRequest', required: true },
  step_number:    Number,
  action:         { type: String, enum: ['submitted','approved','rejected','returned','escalated','cancelled','auto_approved'], required: true },
  actor_id:       { type: ObjId, ref: 'User' },
  actor_name:     String,
  comment:        String,
  duration_hours: Number,
}, { timestamps: true });

approvalHistorySchema.index({ company_id: 1, request_id: 1 });

module.exports = mongoose.model('ApprovalHistory', approvalHistorySchema);
