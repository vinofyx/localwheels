const mongoose = require('mongoose');

const dispatchQueueSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  lr_number:   { type: String, required: true },

  status: {
    type: String,
    enum: ['pending','ready','assigned','loading','dispatched','delayed','cancelled'],
    default: 'pending',
  },
  priority: { type: String, enum: ['emergency','high','normal','low'], default: 'normal' },

  // Shipment snapshot (denormalized for queue display)
  sender_name:    { type: String },
  receiver_name:  { type: String },
  destination:    { type: String },
  weight:         { type: Number, default: 0 },
  packages:       { type: Number, default: 1 },
  vehicle_type_required: { type: String },
  delivery_date:  { type: Date },
  time_window_start: { type: Date },
  time_window_end:   { type: Date },

  // Assignment
  dispatch_plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchPlan' },
  trip_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  vehicle_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle' },
  driver_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  vehicle_number:   { type: String },
  driver_name:      { type: String },

  // SLA tracking
  sla_hours:       { type: Number },
  sla_deadline:    { type: Date },
  is_sla_breached: { type: Boolean, default: false },

  queued_at:    { type: Date, default: Date.now },
  dispatched_at:{ type: Date },
  delay_reason: { type: String },

  created_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

dispatchQueueSchema.index({ company_id: 1, status: 1, priority: -1 });
dispatchQueueSchema.index({ company_id: 1, branch_id: 1, status: 1 });
dispatchQueueSchema.index({ company_id: 1, shipment_id: 1 }, { unique: true });
dispatchQueueSchema.index({ company_id: 1, delivery_date: 1 });

module.exports = mongoose.model('DispatchQueue', dispatchQueueSchema);
