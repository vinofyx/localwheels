const mongoose = require('mongoose');

const warehouseAnalyticsSchema = new mongoose.Schema({
  company_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  warehouse_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  period:            { type: String, enum: ['daily','weekly','monthly'], default: 'daily' },
  period_date:       { type: Date, required: true },

  // Utilization
  utilization_pct:        { type: Number, default: 0 },
  total_bins:             { type: Number, default: 0 },
  occupied_bins:          { type: Number, default: 0 },
  empty_bins:             { type: Number, default: 0 },
  total_inventory_value:  { type: Number, default: 0 },
  total_sku_count:        { type: Number, default: 0 },
  total_qty:              { type: Number, default: 0 },

  // Throughput
  inbound_count:         { type: Number, default: 0 },
  outbound_count:        { type: Number, default: 0 },
  total_items_received:  { type: Number, default: 0 },
  total_items_dispatched:{ type: Number, default: 0 },
  total_movements:       { type: Number, default: 0 },

  // Timing
  avg_receiving_time_min:  { type: Number, default: 0 },
  avg_put_away_time_min:   { type: Number, default: 0 },
  avg_pick_time_min:       { type: Number, default: 0 },
  avg_dispatch_time_min:   { type: Number, default: 0 },

  // Dock
  dock_utilization_pct:    { type: Number, default: 0 },
  dock_delays:             { type: Number, default: 0 },
  avg_dock_turnaround_min: { type: Number, default: 0 },

  // Quality & accuracy
  inventory_accuracy_pct:  { type: Number, default: 100 },
  cycle_count_variance:    { type: Number, default: 0 },
  damaged_items:           { type: Number, default: 0 },
  return_items:            { type: Number, default: 0 },
  quality_rejection_pct:   { type: Number, default: 0 },

  // Workforce
  worker_productivity_avg: { type: Number, default: 0 },
  tasks_completed:         { type: Number, default: 0 },
  tasks_pending:           { type: Number, default: 0 },

  // Inventory turnover
  inventory_turnover_rate: { type: Number, default: 0 },
  days_of_stock:           { type: Number, default: 0 },
  stock_out_events:        { type: Number, default: 0 },

  // AI
  ai_recommendations_generated: { type: Number, default: 0 },
  ai_recommendations_actioned:  { type: Number, default: 0 },
  ai_estimated_savings:         { type: Number, default: 0 },
  ai_explanation:               { type: String, trim: true },

  generated_at: { type: Date, default: Date.now },
}, { timestamps: true });

warehouseAnalyticsSchema.index({ company_id: 1, warehouse_id: 1, period_date: -1 });
warehouseAnalyticsSchema.index({ warehouse_id: 1, period: 1, period_date: -1 });

module.exports = mongoose.model('WarehouseAnalytics', warehouseAnalyticsSchema);
