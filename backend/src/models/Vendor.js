const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name:          { type: String, required: true },
  type:          { type: String, enum: ['service_center','workshop','insurance_provider','fuel_vendor','tyre_vendor','parts_supplier','other'], required: true },
  contact_person: String,
  phone:          String,
  email:          String,
  address:        String,
  city:           String,
  rating:         { type: Number, min: 0, max: 5, default: 0 },
  rating_count:   { type: Number, default: 0 },
  services_offered: [String],
  is_preferred:   { type: Boolean, default: false },
  is_active:      { type: Boolean, default: true },
  total_spend:    { type: Number, default: 0 },
  service_count:  { type: Number, default: 0 },
  notes:          String,
}, { timestamps: true });

vendorSchema.index({ company_id: 1, type: 1, is_active: 1 });

module.exports = mongoose.model('Vendor', vendorSchema);
