const mongoose = require('mongoose');

const dockScheduleSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  warehouse_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  dock_number:     { type: String, required: true },

  vehicle_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle' },
  trip_id:            { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  dispatch_plan_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchPlan' },

  slot_start:          { type: Date, required: true },
  slot_end:             { type: Date, required: true },
  purpose:              { type: String, enum: ['loading','unloading','cross_dock'], default: 'loading' },
  status:               { type: String, enum: ['scheduled','in_progress','completed','cancelled'], default: 'scheduled' },
}, { timestamps: true });

dockScheduleSchema.index({ company_id: 1, warehouse_id: 1, slot_start: 1 });
dockScheduleSchema.index({ company_id: 1, dock_number: 1, slot_start: 1 });

module.exports = mongoose.model('DockSchedule', dockScheduleSchema);
