const mongoose = require('mongoose');

const outboundItemSchema = new mongoose.Schema({
  sku:           { type: String, required: true, trim: true, uppercase: true },
  product_name:  { type: String, trim: true },
  ordered_qty:   { type: Number, default: 0 },
  allocated_qty: { type: Number, default: 0 },
  picked_qty:    { type: Number, default: 0 },
  packed_qty:    { type: Number, default: 0 },
  dispatched_qty:{ type: Number, default: 0 },
  uom:           { type: String, default: 'pcs' },
  bin_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseBin' },
  bin_code:      { type: String, trim: true },
  batch_number:  { type: String, trim: true },
  lot_number:    { type: String, trim: true },
  weight_kg:     { type: Number, default: 0 },
  volume_cbm:    { type: Number, default: 0 },
  unit_value:    { type: Number, default: 0 },
  barcode_scanned: { type: Boolean, default: false },
}, { _id: true });

const outboundShipmentSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  warehouse_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  outbound_number:{ type: String, unique: true, trim: true },
  order_ref:      { type: String, trim: true },
  shipment_ref:   { type: String, trim: true },
  customer_name:  { type: String, trim: true },
  customer_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  delivery_address: { type: String, trim: true },

  // Wave & Dock
  wave_id:        { type: String, trim: true },
  dock_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Dock' },
  dock_number:    { type: String, trim: true },

  // Vehicle
  vehicle_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle' },
  vehicle_number: { type: String, trim: true },
  driver_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  driver_name:    { type: String, trim: true },

  status: {
    type: String,
    enum: ['pending','allocated','pick_list_generated','picking','packing','ready_to_dispatch','loaded','dispatched','cancelled'],
    default: 'pending',
  },

  items: [outboundItemSchema],
  total_skus:          { type: Number, default: 0 },
  total_ordered_qty:   { type: Number, default: 0 },
  total_picked_qty:    { type: Number, default: 0 },
  total_packed_qty:    { type: Number, default: 0 },
  total_weight_kg:     { type: Number, default: 0 },
  total_volume_cbm:    { type: Number, default: 0 },
  total_value:         { type: Number, default: 0 },

  // Timing
  planned_dispatch_at:   { type: Date },
  pick_started_at:       { type: Date },
  pick_completed_at:     { type: Date },
  pack_completed_at:     { type: Date },
  loaded_at:             { type: Date },
  dispatched_at:         { type: Date },

  // Staff
  picked_by_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  picked_by_name:  { type: String, trim: true },
  packed_by_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  packed_by_name:  { type: String, trim: true },
  manifest_generated: { type: Boolean, default: false },
  notes:           { type: String, trim: true },
}, { timestamps: true });

outboundShipmentSchema.pre('save', async function (next) {
  if (!this.outbound_number) {
    const d = new Date();
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    const count = await mongoose.model('OutboundShipment').countDocuments({ company_id: this.company_id });
    this.outbound_number = `OUT-${ym}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

outboundShipmentSchema.index({ company_id: 1, warehouse_id: 1, status: 1 });
outboundShipmentSchema.index({ company_id: 1, outbound_number: 1 });

module.exports = mongoose.model('OutboundShipment', outboundShipmentSchema);
