const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  customer_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customer_email:    String,
  portal_enabled:    { type: Boolean, default: true },
  notifications:     {
    email:     { type: Boolean, default: true },
    sms:       { type: Boolean, default: false },
    whatsapp:  { type: Boolean, default: false },
    in_app:    { type: Boolean, default: true },
  },
  preferred_language:{ type: String, default: 'en' },
  booking_enabled:   { type: Boolean, default: true },
  pod_download:      { type: Boolean, default: true },
  invoice_access:    { type: Boolean, default: true },
  complaint_filing:  { type: Boolean, default: true },
  live_tracking:     { type: Boolean, default: true },
  payment_portal:    { type: Boolean, default: false },
  last_login:        Date,
  login_count:       { type: Number, default: 0 },
}, { timestamps: true });
s.index({ company_id: 1, customer_email: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model('CustomerPortalSettings', s);
