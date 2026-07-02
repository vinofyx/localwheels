const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  warehouse_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  movement_type: {
    type: String,
    enum: ['receive','put_away','pick','pack','dispatch','transfer','adjustment','return','cycle_count','damage','quarantine'],
    required: true,
  },
  sku:           { type: String, required: true, trim: true, uppercase: true },
  product_name:  { type: String, trim: true },
  quantity:      { type: Number, required: true },
  uom:           { type: String, default: 'pcs' },
  batch_number:  { type: String, trim: true },
  lot_number:    { type: String, trim: true },
  serial_number: { type: String, trim: true },

  from_bin_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseBin' },
  from_bin_code: { type: String, trim: true },
  to_bin_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseBin' },
  to_bin_code:   { type: String, trim: true },

  // References
  inbound_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'InboundShipment' },
  outbound_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'OutboundShipment' },
  task_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseTask' },
  reference_number: { type: String, trim: true },

  // Performed by
  performed_by_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performed_by_name: { type: String, trim: true },
  worker_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseWorker' },
  scanned:           { type: Boolean, default: false },
  scan_method:       { type: String, enum: ['barcode','qr','rfid','manual'], default: 'manual' },

  notes:         { type: String, trim: true },
  performed_at:  { type: Date, default: Date.now },
}, { timestamps: true });

inventoryMovementSchema.index({ company_id: 1, warehouse_id: 1, performed_at: -1 });
inventoryMovementSchema.index({ sku: 1, warehouse_id: 1 });
inventoryMovementSchema.index({ movement_type: 1, warehouse_id: 1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
