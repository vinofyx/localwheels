const mongoose = require('mongoose');

const simulationSnapshotSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  twin_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'DigitalTwin' },
  snapshot_date: { type: Date, default: Date.now },
  label:         { type: String },
  description:   { type: String },
  state:         { type: mongoose.Schema.Types.Mixed, default: {} },
  metrics: {
    fleet_utilization: Number,
    warehouse_utilization: Number,
    shipments_active: Number,
    drivers_active: Number,
    cost_per_km: Number,
    co2_per_km: Number,
    on_time_delivery_pct: Number,
  },
  size_bytes:    { type: Number, default: 0 },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags:          [String],
  is_baseline:   { type: Boolean, default: false },
}, { timestamps: true });

simulationSnapshotSchema.index({ company_id: 1, snapshot_date: -1 });
module.exports = mongoose.model('SimulationSnapshot', simulationSnapshotSchema);
