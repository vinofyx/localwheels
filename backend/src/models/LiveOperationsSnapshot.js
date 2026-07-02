const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  captured_at:         { type: Date, default: Date.now },
  vehicles_active:     { type: Number, default: 0 },
  vehicles_idle:       { type: Number, default: 0 },
  vehicles_breakdown:  { type: Number, default: 0 },
  drivers_on_duty:     { type: Number, default: 0 },
  drivers_available:   { type: Number, default: 0 },
  shipments_in_transit:{ type: Number, default: 0 },
  shipments_delayed:   { type: Number, default: 0 },
  shipments_delivered: { type: Number, default: 0 },
  docks_occupied:      { type: Number, default: 0 },
  docks_available:     { type: Number, default: 0 },
  warehouse_capacity_pct: { type: Number, default: 0 },
  open_alerts:         { type: Number, default: 0 },
  open_incidents:      { type: Number, default: 0 },
  pending_orders:      { type: Number, default: 0 },
  route_risks:         { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('LiveOperationsSnapshot', s);
