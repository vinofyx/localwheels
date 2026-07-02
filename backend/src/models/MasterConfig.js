const mongoose = require('mongoose');

// Stores per-company master configuration lists:
// vehicle_types, shipment_types, package_types, complaint_categories,
// document_types, warehouse_types, tax_slabs, cost_centers, departments
const masterConfigSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  category:   { type: String, required: true },  // e.g. 'vehicle_type'
  code:       { type: String },
  name:       { type: String, required: true },
  description: { type: String },
  meta:       { type: mongoose.Schema.Types.Mixed, default: {} },
  sort_order: { type: Number, default: 0 },
  is_active:  { type: Boolean, default: true },
  is_default: { type: Boolean, default: false },
}, { timestamps: true });

masterConfigSchema.index({ company_id: 1, category: 1 });
masterConfigSchema.index({ company_id: 1, category: 1, name: 1 });

module.exports = mongoose.model('MasterConfig', masterConfigSchema);
