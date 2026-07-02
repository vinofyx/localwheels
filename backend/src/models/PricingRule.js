const mongoose = require('mongoose');
const { Schema } = mongoose;

const pricingRuleSchema = new Schema({
  company_id:  { type: Schema.Types.ObjectId, ref: 'Company' },
  vehicle_type:    { type: String, required: true },
  capacity_label:  String,
  capacity_kg:     Number,
  base_rate:       { type: Number, required: true },
  per_km_rate:     { type: Number, required: true },
  fuel_surcharge_pct:    { type: Number, default: 8 },
  local_toll:            { type: Number, default: 0 },
  regional_toll:         { type: Number, default: 500 },
  national_toll:         { type: Number, default: 1500 },
  cross_country_toll:    { type: Number, default: 3000 },
  loading_charge:        { type: Number, default: 0 },
  unloading_charge:      { type: Number, default: 0 },
  gst_rate:              { type: Number, default: 18 },
  insurance_rate:        { type: Number, default: 0.5 },
  express_surcharge_pct: { type: Number, default: 25 },
  premium_surcharge_pct: { type: Number, default: 50 },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

pricingRuleSchema.index({ company_id: 1, vehicle_type: 1 });

module.exports = mongoose.model('PricingRule', pricingRuleSchema);
