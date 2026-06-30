const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name:          { type: String, required: true, trim: true },
  phone:         { type: String, trim: true },
  email:         { type: String, trim: true, lowercase: true },
  address:       { type: String, trim: true },
  city:          { type: String, trim: true },
  state:         { type: String, trim: true },
  pincode:       { type: String, trim: true },
  gst_number:    { type: String, trim: true, uppercase: true },
  customer_type: { type: String, enum: ['individual', 'business'], default: 'individual' },
  credit_limit:  { type: Number, default: 0 },
  credit_days:   { type: Number, default: 0 },
  notes:         { type: String },
  is_active:     { type: Boolean, default: true },
}, { timestamps: true });

customerSchema.index({ company_id: 1, name: 1 });
customerSchema.index({ company_id: 1, phone: 1 });
customerSchema.index({ company_id: 1, is_active: 1 });

module.exports = mongoose.model('Customer', customerSchema);
