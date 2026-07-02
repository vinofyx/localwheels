const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

  event:    { type: String, required: true },   // e.g. 'shipment_created'
  channel:  { type: String, enum: ['email', 'sms', 'whatsapp', 'in_app'], required: true },
  name:     { type: String, required: true },
  subject:  { type: String },                   // email only
  body:     { type: String, required: true },   // supports {{variable}} tokens
  is_active: { type: Boolean, default: true },
  is_default: { type: Boolean, default: false },
}, { timestamps: true });

notificationTemplateSchema.index({ company_id: 1, event: 1, channel: 1 });

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);
