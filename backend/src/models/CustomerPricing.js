const mongoose = require('mongoose');
const { Schema } = mongoose;

const customerPricingSchema = new Schema({
  company_id:    { type: Schema.Types.ObjectId, ref: 'Company' },
  label:         String,
  pricing_type:  { type: String, enum: ['corporate', 'branch', 'seasonal', 'zone', 'one_time'], default: 'corporate' },

  customer_phone: String,
  customer_email: String,
  customer_name:  String,
  gstin:          String,

  discount_type:  { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
  discount_value: { type: Number, required: true },
  max_discount:   Number,

  vehicle_type:   String,
  zone_from:      String,
  zone_to:        String,
  min_weight_kg:  Number,
  min_distance:   Number,

  valid_from:    Date,
  valid_until:   Date,
  is_active:     { type: Boolean, default: true },
  created_by:    { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

customerPricingSchema.index({ company_id: 1, is_active: 1 });
customerPricingSchema.index({ customer_phone: 1 });
customerPricingSchema.index({ gstin: 1 }, { sparse: true });

module.exports = mongoose.model('CustomerPricing', customerPricingSchema);
