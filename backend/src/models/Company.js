const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name:              { type: String, required: true },
  code:              { type: String },
  subscription_plan: { type: String, enum: ['basic', 'pro', 'enterprise'], default: 'basic' },

  // Business identity
  gstin:             { type: String },
  pan:               { type: String },
  cin:               { type: String },
  business_type:     { type: String, enum: ['transport', 'logistics', 'courier', 'freight', 'other'], default: 'transport' },
  industry:          { type: String },

  // Contact
  phone:             { type: String },
  email:             { type: String },
  website:           { type: String },

  // Address
  address:           { type: String },
  city:              { type: String },
  state:             { type: String },
  pincode:           { type: String },
  country:           { type: String, default: 'India' },

  // Locale
  timezone:          { type: String, default: 'Asia/Kolkata' },
  currency:          { type: String, default: 'INR' },
  date_format:       { type: String, default: 'DD/MM/YYYY' },

  // Financial year
  financial_year_start: { type: String, default: 'April' },
  current_fy:           { type: String },

  // Branding
  logo_url:          { type: String },
  primary_color:     { type: String, default: '#0b8fd3' },
  brand_name:        { type: String },

  // Onboarding state
  setup_completed:   { type: Boolean, default: false },
  setup_step:        { type: Number, default: 0 },

  // Operational
  lr_counter:        { type: Number, default: 0 },
  is_active:         { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
