const mongoose = require('mongoose');

const COMPLAINT_TYPES = [
  'Shipment Delay','Shipment Lost','Shipment Damaged','Wrong Delivery',
  'Pickup Delay','Invoice Issue','Payment Issue','Driver Behaviour',
  'Vehicle Issue','Tracking Problem','Website Issue','General Feedback',
];

const COMPLAINT_STATUSES = [
  'New','Open','Assigned','In Progress','Waiting For Customer',
  'Resolved','Closed','Rejected','Escalated',
];

const complaintSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  ticket_number: { type: String, unique: true },

  customer_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customer_name:  { type: String, required: true },
  customer_phone: { type: String },
  customer_email: { type: String },

  type:        { type: String, enum: COMPLAINT_TYPES, required: true },
  status:      { type: String, enum: COMPLAINT_STATUSES, default: 'New' },
  priority:    { type: String, enum: ['Critical','High','Medium','Low'], default: 'Medium' },
  subject:     { type: String, required: true, maxlength: 200 },
  description: { type: String, required: true },

  lr_number:   { type: String },
  shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  vehicle_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle' },
  driver_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },

  department: {
    type: String,
    enum: ['Customer Support','Operations','Dispatch','Fleet','Finance','Warehouse','Sales','Technical Support'],
    default: 'Customer Support',
  },
  assigned_to:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assigned_name: { type: String },
  assigned_at:   { type: Date },

  ai_category:             { type: String },
  ai_priority:             { type: String },
  ai_sentiment:            { type: String, enum: ['positive','neutral','negative','very_negative'], default: 'neutral' },
  ai_sentiment_score:      { type: Number },
  ai_department:           { type: String },
  ai_root_cause:           { type: String },
  ai_suggested_resolution: { type: String },
  ai_auto_reply_draft:     { type: String },
  ai_confidence:           { type: Number },
  ai_flags:                [{ type: String }],
  ai_escalation_recommended: { type: Boolean, default: false },

  is_duplicate: { type: Boolean, default: false },
  duplicate_of: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },

  source: { type: String, enum: ['web','app','chatbot','phone','email','whatsapp'], default: 'web' },
  tags:   [{ type: String }],

  sla_response_deadline:       { type: Date },
  sla_resolution_deadline:     { type: Date },
  first_response_at:           { type: Date },
  is_sla_response_breached:    { type: Boolean, default: false },
  is_sla_resolution_breached:  { type: Boolean, default: false },
  sla_escalated:               { type: Boolean, default: false },
  sla_escalated_at:            { type: Date },

  resolved_at:         { type: Date },
  closed_at:           { type: Date },
  resolution_summary:  { type: String },
  resolution_time_min: { type: Number },
  resolved_by:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  satisfaction_rating:  { type: Number, min: 1, max: 5 },
  satisfaction_comment: { type: String },
  feedback_at:          { type: Date },

  escalated_to:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  escalated_at:      { type: Date },
  escalation_reason: { type: String },

  created_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reopened_at:  { type: Date },
  reopen_count: { type: Number, default: 0 },
}, { timestamps: true });

complaintSchema.index({ company_id: 1, status: 1 });
complaintSchema.index({ company_id: 1, priority: 1, createdAt: -1 });
complaintSchema.index({ company_id: 1, assigned_to: 1 });
complaintSchema.index({ company_id: 1, customer_phone: 1 });
complaintSchema.index({ company_id: 1, lr_number: 1 });
complaintSchema.index({ company_id: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
