const mongoose = require('mongoose');

const warehouseWorkerSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  warehouse_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  user_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:          { type: String, required: true, trim: true },
  employee_id:   { type: String, trim: true },
  phone:         { type: String, trim: true },
  role: {
    type: String,
    enum: ['supervisor','receiver','put_away','picker','packer','forklift_operator','cycle_counter','cross_dock','quality_checker'],
    required: true,
  },
  shift:         { type: String, enum: ['morning','afternoon','night','flexible'], default: 'morning' },
  status:        { type: String, enum: ['active','inactive','on_leave'], default: 'active' },

  // Performance
  tasks_completed_today:  { type: Number, default: 0 },
  tasks_completed_week:   { type: Number, default: 0 },
  tasks_completed_month:  { type: Number, default: 0 },
  productivity_score:     { type: Number, default: 100, min: 0, max: 100 },
  accuracy_rate_pct:      { type: Number, default: 100 },
  avg_task_duration_min:  { type: Number, default: 0 },
  total_items_processed:  { type: Number, default: 0 },
  errors_today:           { type: Number, default: 0 },
  last_task_at:           { type: Date },
  is_active:              { type: Boolean, default: true },
}, { timestamps: true });

warehouseWorkerSchema.index({ company_id: 1, warehouse_id: 1, status: 1 });
warehouseWorkerSchema.index({ warehouse_id: 1, role: 1 });

module.exports = mongoose.model('WarehouseWorker', warehouseWorkerSchema);
