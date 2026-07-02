const mongoose = require('mongoose');

const maintenanceScheduleSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fleet_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  vehicle_number:   { type: String },
  prediction_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'MaintenancePrediction' },
  work_order_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder' },

  title:            { type: String, required: true },
  description:      { type: String },
  maintenance_type: { type: String, required: true },
  category:         { type: String, enum: ['preventive','predictive','corrective','compliance','inspection'], default: 'predictive' },

  priority:         { type: String, enum: ['low','normal','high','urgent','critical'], default: 'normal' },
  status:           { type: String, enum: ['planned','confirmed','in_progress','completed','cancelled','overdue'], default: 'planned' },

  // Scheduling
  scheduled_date:   { type: Date, required: true },
  estimated_duration_hrs: { type: Number, default: 2 },
  completed_date:   { type: Date },
  next_due_date:    { type: Date },
  next_due_km:      { type: Number },
  is_recurring:     { type: Boolean, default: false },
  recurrence_interval_days: { type: Number },

  // Assignment
  workshop_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop' },
  mechanic_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mechanic_name:{ type: String },

  // Cost
  estimated_cost: { type: Number, default: 0 },
  actual_cost:    { type: Number },

  // AI Metadata
  is_ai_scheduled:  { type: Boolean, default: false },
  ai_confidence:    { type: Number },
  downtime_impact:  { type: String }, // e.g. "Vehicle unavailable for 4hrs"

  notes:       { type: String },
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

maintenanceScheduleSchema.index({ company_id: 1, fleet_vehicle_id: 1, scheduled_date: 1 });
maintenanceScheduleSchema.index({ company_id: 1, status: 1, scheduled_date: 1 });
maintenanceScheduleSchema.index({ workshop_id: 1, scheduled_date: 1 });

module.exports = mongoose.model('MaintenanceSchedule', maintenanceScheduleSchema);
