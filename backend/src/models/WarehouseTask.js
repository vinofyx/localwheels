const mongoose = require('mongoose');

const taskItemSchema = new mongoose.Schema({
  sku:        { type: String, trim: true, uppercase: true },
  product_name: { type: String, trim: true },
  quantity:   { type: Number, default: 0 },
  uom:        { type: String, default: 'pcs' },
  bin_code:   { type: String, trim: true },
  bin_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseBin' },
  done:       { type: Boolean, default: false },
}, { _id: true });

const warehouseTaskSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  warehouse_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  task_number:   { type: String, trim: true },
  task_type: {
    type: String,
    enum: ['receive','put_away','pick','pack','cycle_count','transfer','replenish','cross_dock','quality_check','damage_report'],
    required: true,
  },
  priority:      { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
  status:        { type: String, enum: ['pending','assigned','in_progress','completed','cancelled','on_hold'], default: 'pending' },

  assigned_to_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assigned_to_name: { type: String, trim: true },
  worker_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseWorker' },

  // Reference
  inbound_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'InboundShipment' },
  outbound_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'OutboundShipment' },
  reference_number: { type: String, trim: true },

  items: [taskItemSchema],
  total_items:   { type: Number, default: 0 },
  items_done:    { type: Number, default: 0 },

  // AI-generated route
  ai_picking_route: [{ step: Number, bin_code: String, sku: String, qty: Number }],
  estimated_duration_min: { type: Number },
  actual_duration_min:    { type: Number },

  started_at:    { type: Date },
  completed_at:  { type: Date },
  due_at:        { type: Date },
  notes:         { type: String, trim: true },
}, { timestamps: true });

warehouseTaskSchema.pre('save', async function (next) {
  if (!this.task_number) {
    const d = new Date();
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
    const count = await mongoose.model('WarehouseTask').countDocuments({ company_id: this.company_id });
    this.task_number = `TASK-${ym}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

warehouseTaskSchema.index({ company_id: 1, warehouse_id: 1, status: 1 });
warehouseTaskSchema.index({ assigned_to_id: 1, status: 1 });
warehouseTaskSchema.index({ warehouse_id: 1, task_type: 1 });

module.exports = mongoose.model('WarehouseTask', warehouseTaskSchema);
