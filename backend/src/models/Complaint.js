const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  branch_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  ticket_id:     { type: String, required: true, unique: true, uppercase: true },
  lr_number:     { type: String, trim: true, uppercase: true },
  shipment_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  issue_type:    {
    type: String,
    enum: ['delayed', 'damaged', 'lost', 'wrong_delivery', 'billing', 'other'],
    required: true,
  },
  description:   { type: String, required: true, trim: true },
  contact_name:  { type: String, trim: true },
  contact_phone: { type: String, trim: true },
  contact_email: { type: String, trim: true, lowercase: true },
  status:        { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  priority:      { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  resolution:    { type: String, trim: true },
  source:        { type: String, enum: ['chatbot', 'staff', 'portal', 'phone'], default: 'chatbot' },
  resolved_at:   { type: Date },
  assigned_to:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

complaintSchema.index({ ticket_id: 1 });
complaintSchema.index({ company_id: 1, status: 1 });
complaintSchema.index({ lr_number: 1 });
complaintSchema.index({ company_id: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
