const mongoose = require('mongoose');

const warehouseAIRecommendationSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  recommendation_type: {
    type: String,
    enum: [
      'bin_allocation','picking_route','replenishment','dock_scheduling',
      'labour_optimization','space_optimization','cross_dock','congestion',
      'temperature_alert','expiry_alert','slow_moving','fast_moving',
    ],
    required: true,
  },
  title:          { type: String, required: true, trim: true },
  priority:       { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  status:         { type: String, enum: ['active','actioned','dismissed','expired'], default: 'active' },
  ai_explanation: { type: String, trim: true },
  details:        { type: mongoose.Schema.Types.Mixed },

  // Affected resources
  sku:            { type: String, trim: true },
  bin_code:       { type: String, trim: true },
  zone_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseZone' },
  task_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'WarehouseTask' },

  // Impact
  estimated_savings:      { type: Number, default: 0 },
  estimated_time_saved_min: { type: Number, default: 0 },
  estimated_space_freed_pct:{ type: Number, default: 0 },
  confidence_score:         { type: Number, default: 0.8, min: 0, max: 1 },

  is_actioned:   { type: Boolean, default: false },
  actioned_at:   { type: Date },
  actioned_by:   { type: String, trim: true },
  expires_at:    { type: Date },
}, { timestamps: true });

warehouseAIRecommendationSchema.index({ company_id: 1, warehouse_id: 1, status: 1 });
warehouseAIRecommendationSchema.index({ warehouse_id: 1, priority: 1 });

module.exports = mongoose.model('WarehouseAIRecommendation', warehouseAIRecommendationSchema);
