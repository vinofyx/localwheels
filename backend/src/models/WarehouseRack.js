const mongoose = require('mongoose');

const warehouseRackSchema = new mongoose.Schema({
  company_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  warehouse_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  zone_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseZone', required: true },
  rack_code:       { type: String, required: true, trim: true, uppercase: true },
  rack_name:       { type: String, trim: true },
  rack_type:       { type: String, enum: ['selective','drive_in','push_back','pallet_flow','cantilever','mobile','automated'], default: 'selective' },
  total_shelves:   { type: Number, default: 1 },
  total_bins:      { type: Number, default: 0 },
  available_bins:  { type: Number, default: 0 },
  max_weight_kg:   { type: Number, default: 1000 },
  height_m:        { type: Number, default: 2 },
  width_m:         { type: Number, default: 1 },
  depth_m:         { type: Number, default: 1 },
  utilization_pct: { type: Number, default: 0, min: 0, max: 100 },
  is_active:       { type: Boolean, default: true },
}, { timestamps: true });

warehouseRackSchema.index({ company_id: 1, warehouse_id: 1 });
warehouseRackSchema.index({ warehouse_id: 1, rack_code: 1 }, { unique: true });

module.exports = mongoose.model('WarehouseRack', warehouseRackSchema);
