const mongoose = require('mongoose');

const inboundItemSchema = new mongoose.Schema({
  sku:              { type: String, required: true, trim: true, uppercase: true },
  product_name:     { type: String, trim: true },
  expected_qty:     { type: Number, default: 0 },
  received_qty:     { type: Number, default: 0 },
  damaged_qty:      { type: Number, default: 0 },
  rejected_qty:     { type: Number, default: 0 },
  uom:              { type: String, default: 'pcs' },
  batch_number:     { type: String, trim: true },
  lot_number:       { type: String, trim: true },
  expiry_date:      { type: Date },
  weight_kg:        { type: Number, default: 0 },
  volume_cbm:       { type: Number, default: 0 },
  unit_cost:        { type: Number, default: 0 },
  bin_id:           { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseBin' },
  bin_code:         { type: String, trim: true },
  quality_status:   { type: String, enum: ['pending','passed','failed','partial'], default: 'pending' },
  quality_notes:    { type: String, trim: true },
  barcode_scanned:  { type: Boolean, default: false },
}, { _id: true });

const inboundShipmentSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  warehouse_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  inbound_number:   { type: String, unique: true, trim: true },
  shipment_ref:     { type: String, trim: true },
  po_number:        { type: String, trim: true },
  supplier_name:    { type: String, trim: true },
  supplier_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },

  // Vehicle & Driver
  vehicle_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle' },
  vehicle_number:   { type: String, trim: true },
  driver_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  driver_name:      { type: String, trim: true },

  // Dock
  dock_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Dock' },
  dock_number:      { type: String, trim: true },

  // Timing
  expected_arrival: { type: Date },
  actual_arrival:   { type: Date },
  receiving_started_at: { type: Date },
  receiving_completed_at: { type: Date },
  put_away_completed_at:  { type: Date },

  status: {
    type: String,
    enum: ['scheduled','arrived','unloading','receiving','quality_check','put_away','completed','cancelled','rejected'],
    default: 'scheduled',
  },

  items:            [inboundItemSchema],
  total_skus:       { type: Number, default: 0 },
  total_expected_qty:  { type: Number, default: 0 },
  total_received_qty:  { type: Number, default: 0 },
  total_damaged_qty:   { type: Number, default: 0 },
  total_weight_kg:     { type: Number, default: 0 },
  total_volume_cbm:    { type: Number, default: 0 },

  // Receiving team
  received_by_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  received_by_name: { type: String, trim: true },
  supervisor_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:            { type: String, trim: true },
  unload_checklist_done: { type: Boolean, default: false },
  quality_approved:      { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate inbound_number
inboundShipmentSchema.pre('save', async function (next) {
  if (!this.inbound_number) {
    const d = new Date();
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    const count = await mongoose.model('InboundShipment').countDocuments({ company_id: this.company_id });
    this.inbound_number = `IN-${ym}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

inboundShipmentSchema.index({ company_id: 1, warehouse_id: 1, status: 1 });
inboundShipmentSchema.index({ company_id: 1, inbound_number: 1 });
inboundShipmentSchema.index({ warehouse_id: 1, actual_arrival: -1 });

module.exports = mongoose.model('InboundShipment', inboundShipmentSchema);
