const mongoose = require('mongoose');

const appSettingsSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, unique: true },

  // SMTP
  smtp: {
    host:     { type: String, default: '' },
    port:     { type: Number, default: 587 },
    user:     { type: String, default: '' },
    password: { type: String, default: '' },
    from:     { type: String, default: '' },
    enabled:  { type: Boolean, default: false },
  },

  // SMS
  sms: {
    provider:  { type: String, enum: ['twilio', 'msg91', 'textlocal', 'none'], default: 'none' },
    api_key:   { type: String, default: '' },
    sender_id: { type: String, default: '' },
    enabled:   { type: Boolean, default: false },
  },

  // WhatsApp
  whatsapp: {
    provider:     { type: String, enum: ['twilio', 'wati', 'interakt', 'none'], default: 'none' },
    api_key:      { type: String, default: '' },
    phone_number: { type: String, default: '' },
    enabled:      { type: Boolean, default: false },
  },

  // Notification rules
  notifications: {
    shipment_created:      { email: Boolean, sms: Boolean, whatsapp: Boolean },
    shipment_delivered:    { email: Boolean, sms: Boolean, whatsapp: Boolean },
    invoice_generated:     { email: Boolean, sms: Boolean, whatsapp: Boolean },
    payment_received:      { email: Boolean, sms: Boolean, whatsapp: Boolean },
    complaint_raised:      { email: Boolean, sms: Boolean, whatsapp: Boolean },
    pod_uploaded:          { email: Boolean, sms: Boolean, whatsapp: Boolean },
    eway_expiring:         { email: Boolean, sms: Boolean, whatsapp: Boolean },
  },

  // Operational defaults
  defaults: {
    payment_terms_days:  { type: Number, default: 30 },
    credit_limit:        { type: Number, default: 0 },
    gst_rate:            { type: Number, default: 18 },
    invoice_prefix:      { type: String, default: 'INV' },
    lr_prefix:           { type: String, default: 'LR' },
    auto_invoice:        { type: Boolean, default: false },
    require_pod_before_invoice: { type: Boolean, default: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('AppSettings', appSettingsSchema);
