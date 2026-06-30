const mongoose = require('mongoose');
const { Schema } = mongoose;

const fuelPriceSchema = new Schema({
  company_id:         { type: Schema.Types.ObjectId, ref: 'Company' },
  fuel_type:          { type: String, enum: ['diesel', 'petrol', 'cng'], default: 'diesel' },
  price_per_liter:    { type: Number, required: true, min: 0 },
  reference_price:    { type: Number, default: 90 },
  base_surcharge_pct: { type: Number, default: 8 },
  region:             String,
  is_current:         { type: Boolean, default: true },
  updated_by:         { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

fuelPriceSchema.index({ company_id: 1, is_current: 1, fuel_type: 1 });

module.exports = mongoose.model('FuelPrice', fuelPriceSchema);
