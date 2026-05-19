const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  subscription_plan: { type: String, enum: ['basic', 'pro', 'enterprise'], default: 'basic' },
  lr_counter: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
