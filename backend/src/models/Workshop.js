const mongoose = require('mongoose');

const mechanicSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  specialization:{ type: [String] }, // e.g. ['engine','brakes']
  experience_years: { type: Number },
  is_available:  { type: Boolean, default: true },
  phone:         { type: String },
  employee_id:   { type: String },
}, { _id: true });

const workshopSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

  name:        { type: String, required: true },
  code:        { type: String },
  type:        { type: String, enum: ['in_house','authorized','third_party','mobile'], default: 'authorized' },
  status:      { type: String, enum: ['active','inactive','full'], default: 'active' },

  address:     { type: String },
  city:        { type: String },
  state:       { type: String },
  pincode:     { type: String },
  location:    { lat: Number, lng: Number },

  contact_name:  { type: String },
  contact_phone: { type: String },
  contact_email: { type: String },

  // Capacity
  capacity_bays:       { type: Number, default: 4 },
  available_bays:      { type: Number, default: 4 },
  active_work_orders:  { type: Number, default: 0 },

  // Mechanics
  mechanics: [mechanicSchema],

  // Performance
  avg_turnaround_hrs:    { type: Number },
  total_work_orders:     { type: Number, default: 0 },
  completed_work_orders: { type: Number, default: 0 },
  rating:                { type: Number, min: 1, max: 5 },

  // Certifications
  certifications: [{ type: String }],
  specializations:[{ type: String }],

  // Cost
  labour_rate_per_hr: { type: Number },

  notes:      { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

workshopSchema.index({ company_id: 1, status: 1 });

module.exports = mongoose.model('Workshop', workshopSchema);
