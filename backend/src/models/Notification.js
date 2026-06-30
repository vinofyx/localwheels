const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  type:           {
    type: String,
    enum: ['eway_expiry', 'pod_pending', 'payment_overdue', 'shipment_delayed', 'complaint_new', 'complaint_resolved', 'booking_new', 'system'],
    required: true,
  },
  title:          { type: String, required: true, trim: true },
  message:        { type: String, required: true, trim: true },
  reference_id:   { type: mongoose.Schema.Types.ObjectId },
  reference_type: { type: String },
  is_read:        { type: Boolean, default: false },
  read_by:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  priority:       { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  expires_at:     { type: Date },
}, { timestamps: true });

notificationSchema.index({ company_id: 1, is_read: 1 });
notificationSchema.index({ company_id: 1, createdAt: -1 });
notificationSchema.index({ company_id: 1, branch_id: 1, is_read: 1 });
notificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = mongoose.model('Notification', notificationSchema);
