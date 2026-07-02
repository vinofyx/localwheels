const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  document_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

  stage: {
    type: String,
    enum: ['pending','ai_reviewed','supervisor_review','approved','rejected','correction_required'],
    default: 'pending',
    index: true,
  },

  history: [{
    stage:      String,
    action:     { type: String, enum: ['submitted','ai_reviewed','escalated','approved','rejected','correction_requested','resubmitted'] },
    by:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    by_name:    String,
    by_role:    String,
    comment:    String,
    timestamp:  { type: Date, default: Date.now },
  }],

  ai_recommendation:  String,
  ai_confidence:      Number,
  ai_reviewed_at:     Date,

  assigned_to:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assigned_at:        Date,
  due_date:           Date,

  final_decision:     { type: String, enum: ['approved','rejected','correction_required'] },
  final_decision_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  final_decision_at:  Date,
  rejection_reason:   String,
  correction_notes:   String,

}, { timestamps: true });

module.exports = mongoose.model('DocumentApproval', approvalSchema);
