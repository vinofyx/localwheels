const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  warehouse_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  zone_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseZone' },
  rack_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseRack' },
  bin_id:           { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseBin' },

  // Product identification
  sku:              { type: String, required: true, trim: true, uppercase: true },
  product_name:     { type: String, required: true, trim: true },
  category:         { type: String, trim: true },
  description:      { type: String, trim: true },
  barcode:          { type: String, trim: true },
  qr_code:          { type: String, trim: true },

  // Batch / lot / serial
  batch_number:     { type: String, trim: true },
  lot_number:       { type: String, trim: true },
  serial_number:    { type: String, trim: true },
  manufactured_date:{ type: Date },
  expiry_date:      { type: Date },
  is_expired:       { type: Boolean, default: false },

  // Quantities
  quantity:         { type: Number, required: true, default: 0, min: 0 },
  reserved_qty:     { type: Number, default: 0 },
  blocked_qty:      { type: Number, default: 0 },
  available_qty:    { type: Number, default: 0 },
  uom:              { type: String, default: 'pcs', trim: true }, // unit of measure

  // Physical
  weight_per_unit_kg:  { type: Number, default: 0 },
  volume_per_unit_cbm: { type: Number, default: 0 },
  total_weight_kg:     { type: Number, default: 0 },
  total_volume_cbm:    { type: Number, default: 0 },

  // Value
  unit_cost:        { type: Number, default: 0 },
  total_value:      { type: Number, default: 0 },
  currency:         { type: String, default: 'KES' },

  // Status
  status:           { type: String, enum: ['available','reserved','blocked','damaged','quarantine','returned','expired'], default: 'available' },
  damage_notes:     { type: String, trim: true },

  // Cycle count
  last_count_date:  { type: Date },
  count_variance:   { type: Number, default: 0 },

  // Source reference
  inbound_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'InboundShipment' },
  supplier_name:    { type: String, trim: true },
  received_at:      { type: Date, default: Date.now },
}, { timestamps: true });

inventorySchema.index({ company_id: 1, warehouse_id: 1, sku: 1 });
inventorySchema.index({ company_id: 1, sku: 1, status: 1 });
inventorySchema.index({ warehouse_id: 1, bin_id: 1 });
inventorySchema.index({ barcode: 1, company_id: 1 }, { sparse: true });
inventorySchema.index({ expiry_date: 1 }, { sparse: true });

// Auto-calculate available qty
inventorySchema.pre('save', function (next) {
  this.available_qty = Math.max(0, this.quantity - this.reserved_qty - this.blocked_qty);
  this.total_weight_kg = this.quantity * (this.weight_per_unit_kg || 0);
  this.total_volume_cbm = this.quantity * (this.volume_per_unit_cbm || 0);
  this.total_value = this.quantity * (this.unit_cost || 0);
  if (this.expiry_date && new Date(this.expiry_date) < new Date()) this.is_expired = true;
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
