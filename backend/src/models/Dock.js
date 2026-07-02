const mongoose = require('mongoose');

const dockSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  warehouse_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  dock_number:    { type: String, required: true, trim: true, uppercase: true },
  dock_name:      { type: String, trim: true },
  dock_type:      { type: String, enum: ['inbound','outbound','cross_dock','flexible'], default: 'flexible' },
  dock_size:      { type: String, enum: ['small','medium','large','extra_large'], default: 'medium' },
  status:         { type: String, enum: ['available','occupied','maintenance','closed'], default: 'available' },
  equipment:      [{ type: String }], // forklift, conveyor, dock_leveler etc.

  // Current occupant
  current_vehicle_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle' },
  current_vehicle_number:{ type: String, trim: true },
  current_inbound_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'InboundShipment' },
  current_outbound_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'OutboundShipment' },
  occupied_since:        { type: Date },
  expected_free_at:      { type: Date },

  // Stats
  utilization_pct:       { type: Number, default: 0 },
  avg_turnaround_min:    { type: Number, default: 0 },
  total_vehicles_today:  { type: Number, default: 0 },
  is_active:             { type: Boolean, default: true },
  notes:                 { type: String, trim: true },
}, { timestamps: true });

dockSchema.index({ company_id: 1, warehouse_id: 1, status: 1 });
dockSchema.index({ warehouse_id: 1, dock_number: 1 }, { unique: true });

module.exports = mongoose.model('Dock', dockSchema);
