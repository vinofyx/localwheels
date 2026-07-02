const mongoose = require('mongoose');

const vehicleMaintenanceSchema = new mongoose.Schema({
  company_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fleet_vehicle_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  vehicle_number:  { type: String },

  maintenance_type: {
    type: String,
    enum: [
      'engine_oil','oil_filter','air_filter','fuel_filter','coolant',
      'brake_service','brake_pads','brake_fluid',
      'tyre_replacement','wheel_alignment','wheel_balancing',
      'battery','alternator','starter',
      'suspension','shock_absorber','steering',
      'ac_service','clutch','gearbox',
      'general_service','body_repair','electrical',
      'insurance_renewal','fitness_renewal','permit_renewal','puc_renewal','road_tax',
      'other',
    ],
    required: true,
  },
  maintenance_category: {
    type: String,
    enum: ['preventive','corrective','predictive','compliance'],
    default: 'preventive',
  },

  status:    { type: String, enum: ['scheduled','in_progress','completed','cancelled','overdue'], default: 'scheduled' },
  priority:  { type: String, enum: ['low','normal','high','urgent'], default: 'normal' },

  scheduled_date: { type: Date },
  completed_date: { type: Date },
  next_due_date:  { type: Date },
  next_due_km:    { type: Number },

  odometer_at_service: { type: Number },
  cost:                { type: Number, default: 0 },
  parts_cost:          { type: Number, default: 0 },
  labour_cost:         { type: Number, default: 0 },

  vendor_name:    { type: String },
  vendor_invoice: { type: String },

  description:  { type: String },
  notes:        { type: String },
  is_ai_predicted: { type: Boolean, default: false },
  ai_confidence:   { type: Number },

  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

vehicleMaintenanceSchema.index({ company_id: 1, fleet_vehicle_id: 1, scheduled_date: -1 });
vehicleMaintenanceSchema.index({ company_id: 1, status: 1 });
vehicleMaintenanceSchema.index({ company_id: 1, next_due_date: 1 });

module.exports = mongoose.model('VehicleMaintenance', vehicleMaintenanceSchema);
