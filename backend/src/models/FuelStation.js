const mongoose = require('mongoose');

const fuelStationSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name:          { type: String, required: true },
  brand:          String,
  lat:             { type: Number, required: true },
  lng:             { type: Number, required: true },
  address:          String,
  fuel_price_per_l: Number,
  fuel_type:        { type: String, enum: ['diesel','petrol','cng','ev_charging'], default: 'diesel' },
  is_preferred:      { type: Boolean, default: false },
  has_ev_charging:    { type: Boolean, default: false },
  rating:              { type: Number, min: 0, max: 5, default: 0 },
  is_active:           { type: Boolean, default: true },
}, { timestamps: true });

fuelStationSchema.index({ company_id: 1, is_active: 1 });
fuelStationSchema.index({ company_id: 1, lat: 1, lng: 1 });

module.exports = mongoose.model('FuelStation', fuelStationSchema);
