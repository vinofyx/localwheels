const mongoose = require('mongoose');

const partInventorySchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  part_name:      { type: String, required: true },
  part_number:    String,
  category:       { type: String, enum: ['engine','gearbox','brake','electrical','tyre','battery','suspension','body','other'], default: 'other' },
  compatible_vehicle_types: [String],
  unit:           { type: String, default: 'pcs' },
  quantity_in_stock: { type: Number, default: 0 },
  quantity_reserved: { type: Number, default: 0 },
  reorder_level:  { type: Number, default: 5 },
  unit_cost:      Number,
  vendor_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  warranty_months: Number,
  last_restocked_at: Date,
  is_active:      { type: Boolean, default: true },
}, { timestamps: true });

partInventorySchema.index({ company_id: 1, category: 1 });
partInventorySchema.index({ company_id: 1, part_number: 1 });

const partReservationSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  part_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'PartInventory', required: true },
  vehicle_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle' },
  maintenance_id: { type: mongoose.Schema.Types.ObjectId, ref: 'VehicleMaintenance' },
  quantity:       { type: Number, required: true },
  status:         { type: String, enum: ['reserved','consumed','released'], default: 'reserved' },
  reserved_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  released_at:    Date,
}, { timestamps: true });

module.exports = {
  PartInventory:    mongoose.model('PartInventory', partInventorySchema),
  PartReservation:  mongoose.model('PartReservation', partReservationSchema),
};
