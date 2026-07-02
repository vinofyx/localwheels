const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjId = Schema.Types.ObjectId;

const approvalWorkflowSchema = new Schema({
  company_id:   { type: ObjId, ref: 'Company', required: true, index: true },
  name:         { type: String, required: true },
  entity_type:  { type: String, enum: ['purchase_order','sales_order','quote','shipment','complaint','supplier','leave','expense','custom'], required: true },
  description:  String,
  is_active:    { type: Boolean, default: true },
  steps: [{
    step_number:    { type: Number, required: true },
    name:           String,
    approver_role:  String,
    approver_id:    { type: ObjId, ref: 'User' },
    approval_type:  { type: String, enum: ['any','all','majority'], default: 'any' },
    sla_hours:      { type: Number, default: 24 },
    on_approve:     { type: String, enum: ['next_step','complete','notify'], default: 'next_step' },
    on_reject:      { type: String, enum: ['reject','return_to_prev','restart'], default: 'reject' },
    auto_approve_after_hours: Number,
  }],
  created_by: { type: ObjId, ref: 'User' },
}, { timestamps: true });

approvalWorkflowSchema.index({ company_id: 1, entity_type: 1, is_active: 1 });

module.exports = mongoose.model('ApprovalWorkflow', approvalWorkflowSchema);
