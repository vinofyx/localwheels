const mongoose = require('mongoose');

const warehouseZoneSchema = new mongoose.Schema({
  company_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  warehouse_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  zone_code:       { type: String, required: true, trim: true, uppercase: true },
  zone_name:       { type: String, required: true, trim: true },
  zone_type:       { type: String, enum: ['dry','cold','frozen','hazmat','returns','staging','dispatch','overflow','bulk','high_value'], default: 'dry' },
  description:     { type: String, trim: true },
  total_racks:     { type: Number, default: 0 },
  available_racks: { type: Number, default: 0 },
  total_bins:      { type: Number, default: 0 },
  available_bins:  { type: Number, default: 0 },
  area_sqm:        { type: Number, default: 0 },
  max_weight_tons: { type: Number, default: 0 },
  temperature_min: { type: Number },
  temperature_max: { type: Number },
  utilization_pct: { type: Number, default: 0, min: 0, max: 100 },
  is_active:       { type: Boolean, default: true },
}, { timestamps: true });

warehouseZoneSchema.index({ company_id: 1, warehouse_id: 1, is_active: 1 });
warehouseZoneSchema.index({ warehouse_id: 1, zone_code: 1 }, { unique: true });

module.exports = mongoose.model('WarehouseZone', warehouseZoneSchema);
