const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  period:          { type: String, enum: ['daily','weekly','monthly'], default: 'daily' },
  snapshot_date:   { type: Date, required: true },
  revenue_today:   { type: Number, default: 0 },
  revenue_month:   { type: Number, default: 0 },
  shipments_today: { type: Number, default: 0 },
  deliveries_today:{ type: Number, default: 0 },
  active_vehicles: { type: Number, default: 0 },
  active_drivers:  { type: Number, default: 0 },
  open_orders:     { type: Number, default: 0 },
  open_incidents:  { type: Number, default: 0 },
  open_risks:      { type: Number, default: 0 },
  warehouse_utilization: { type: Number, default: 0 },
  fleet_utilization:     { type: Number, default: 0 },
  on_time_delivery_pct:  { type: Number, default: 0 },
  customer_satisfaction: { type: Number, default: 0 },
  supplier_compliance:   { type: Number, default: 0 },
  cost_per_delivery:     { type: Number, default: 0 },
  ai_summary:      String,
  ai_risks:        [String],
  ai_opportunities:[String],
}, { timestamps: true });
s.index({ company_id: 1, snapshot_date: -1 });
module.exports = mongoose.model('ExecutiveSnapshot', s);
