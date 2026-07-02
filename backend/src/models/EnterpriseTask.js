const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  title:         { type: String, required: true },
  description:   String,
  type:          { type: String, enum: ['approval','action','review','escalation','follow_up','inspection','other'], default: 'action' },
  priority:      { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
  status:        { type: String, enum: ['pending','in_progress','awaiting_approval','approved','rejected','completed','cancelled'], default: 'pending' },
  assigned_to:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assigned_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at:   Date,
  due_date:      Date,
  completed_at:  Date,
  entity_type:   String,
  entity_id:     mongoose.Schema.Types.ObjectId,
  entity_ref:    String,
  approval_note: String,
  tags:          [String],
}, { timestamps: true });
s.index({ company_id: 1, status: 1, due_date: 1 });
module.exports = mongoose.model('EnterpriseTask', s);
