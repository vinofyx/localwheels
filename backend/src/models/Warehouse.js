const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  company_id:                  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:                   { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  name:                        { type: String, required: true, trim: true },
  address:                     { type: String, trim: true },
  city:                        { type: String, trim: true },
  state:                       { type: String, trim: true },
  pincode:                     { type: String, trim: true },
  capacity_sqft:               { type: Number, default: 0 },
  current_occupancy_percent:   { type: Number, default: 0, min: 0, max: 100 },
  manager_name:                { type: String, trim: true },
  manager_phone:               { type: String, trim: true },
  is_active:                   { type: Boolean, default: true },
}, { timestamps: true });

warehouseSchema.index({ company_id: 1, is_active: 1 });
warehouseSchema.index({ company_id: 1, branch_id: 1 });

module.exports = mongoose.model('Warehouse', warehouseSchema);
