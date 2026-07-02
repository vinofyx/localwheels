const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjId = Schema.Types.ObjectId;

const approvalRequestSchema = new Schema({
  company_id:     { type: ObjId, ref: 'Company', required: true, index: true },
  workflow_id:    { type: ObjId, ref: 'ApprovalWorkflow' },
  workflow_name:  String,
  request_ref:    { type: String, unique: true },
  entity_type:    String,
  entity_id:      ObjId,
  entity_ref:     String,
  title:          { type: String, required: true },
  description:    String,
  amount:         Number,
  requested_by:   { type: ObjId, ref: 'User', required: true },
  requester_name: String,
  current_step:   { type: Number, default: 1 },
  total_steps:    Number,
  status:         { type: String, enum: ['pending','in_review','approved','rejected','cancelled','expired'], default: 'pending' },
  due_at:         Date,
  completed_at:   Date,
  metadata:       Schema.Types.Mixed,
}, { timestamps: true });

approvalRequestSchema.index({ company_id: 1, status: 1, createdAt: -1 });
approvalRequestSchema.index({ company_id: 1, requested_by: 1 });

approvalRequestSchema.pre('save', async function (next) {
  if (!this.request_ref) {
    const d = new Date();
    const ym = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}`;
    const last = await this.constructor.findOne({ request_ref: new RegExp(`^APR-${ym}-`) })
      .sort({ request_ref: -1 }).select('request_ref').lean();
    const seq = last ? parseInt(last.request_ref.split('-')[2]) + 1 : 1;
    this.request_ref = `APR-${ym}-${String(seq).padStart(4,'0')}`;
  }
  next();
});

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
