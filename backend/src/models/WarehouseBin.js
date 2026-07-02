const mongoose = require('mongoose');

const warehouseBinSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  warehouse_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  zone_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseZone', required: true },
  rack_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseRack', required: true },
  bin_code:         { type: String, required: true, trim: true, uppercase: true },
  aisle:            { type: String, trim: true },
  shelf_level:      { type: String, trim: true },
  barcode:          { type: String, trim: true },
  qr_code:          { type: String, trim: true },
  status:           { type: String, enum: ['empty','occupied','reserved','blocked','damaged','maintenance'], default: 'empty' },
  max_weight_kg:    { type: Number, default: 500 },
  max_volume_cbm:   { type: Number, default: 1 },
  current_weight_kg:{ type: Number, default: 0 },
  current_volume_cbm:{ type: Number, default: 0 },
  // current inventory reference
  inventory_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
  sku:              { type: String, trim: true },
  batch_number:     { type: String, trim: true },
  lot_number:       { type: String, trim: true },
  quantity:         { type: Number, default: 0 },
  last_movement_at: { type: Date },
  is_active:        { type: Boolean, default: true },
}, { timestamps: true });

warehouseBinSchema.index({ company_id: 1, warehouse_id: 1, status: 1 });
warehouseBinSchema.index({ warehouse_id: 1, bin_code: 1 }, { unique: true });
warehouseBinSchema.index({ barcode: 1 }, { sparse: true });
warehouseBinSchema.index({ sku: 1, warehouse_id: 1 });

module.exports = mongoose.model('WarehouseBin', warehouseBinSchema);
