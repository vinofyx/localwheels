const mongoose = require('mongoose');

const partsUsedSchema = new mongoose.Schema({
  part_name:   { type: String },
  part_number: { type: String },
  quantity:    { type: Number, default: 1 },
  unit_cost:   { type: Number },
  total_cost:  { type: Number },
  supplier:    { type: String },
}, { _id: false });

const workOrderSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fleet_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  vehicle_number:   { type: String },
  schedule_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'MaintenanceSchedule' },
  prediction_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'MaintenancePrediction' },

  // WO Number
  wo_number:    { type: String, unique: true },

  // Assignment
  workshop_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop' },
  workshop_name:{ type: String },
  mechanic_name:{ type: String },

  // Work
  title:            { type: String, required: true },
  description:      { type: String },
  maintenance_types:[{ type: String }], // multiple tasks possible
  category:         { type: String, enum: ['preventive','predictive','corrective','compliance','emergency'], default: 'predictive' },
  priority:         { type: String, enum: ['low','normal','high','urgent','critical'], default: 'normal' },

  status: {
    type: String,
    enum: ['draft','open','assigned','in_progress','awaiting_parts','completed','cancelled','on_hold'],
    default: 'draft',
  },

  // Timeline
  created_at_date:   { type: Date, default: Date.now },
  scheduled_start:   { type: Date },
  actual_start:      { type: Date },
  estimated_end:     { type: Date },
  actual_end:        { type: Date },
  estimated_duration_hrs: { type: Number },
  actual_duration_hrs:    { type: Number },

  // Odometer
  odometer_at_checkin:  { type: Number },
  odometer_at_checkout: { type: Number },

  // Financials
  labour_hrs:    { type: Number, default: 0 },
  labour_rate:   { type: Number, default: 0 },
  labour_cost:   { type: Number, default: 0 },
  parts_cost:    { type: Number, default: 0 },
  total_cost:    { type: Number, default: 0 },
  estimated_cost:{ type: Number },
  parts_used:    [partsUsedSchema],

  // Checklists
  pre_checklist_done:  { type: Boolean, default: false },
  post_checklist_done: { type: Boolean, default: false },

  // Warranty
  warranty_claim: { type: Boolean, default: false },
  warranty_ref:   { type: String },

  // Notes
  diagnosis:    { type: String },
  work_done:    { type: String },
  notes:        { type: String },
  customer_feedback: { type: String },
  rating:       { type: Number, min: 1, max: 5 },

  // AI
  is_ai_generated: { type: Boolean, default: false },
  ai_priority_reason:{ type: String },

  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  closed_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

workOrderSchema.index({ company_id: 1, status: 1, scheduled_start: 1 });
workOrderSchema.index({ company_id: 1, fleet_vehicle_id: 1, createdAt: -1 });
workOrderSchema.index({ workshop_id: 1, status: 1 });

// Auto-generate WO number
workOrderSchema.pre('save', async function (next) {
  if (!this.wo_number) {
    const count = await this.constructor.countDocuments({ company_id: this.company_id });
    const date = new Date();
    this.wo_number = `WO-${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}-${String(count+1).padStart(4,'0')}`;
  }
  next();
});

module.exports = mongoose.model('WorkOrder', workOrderSchema);
