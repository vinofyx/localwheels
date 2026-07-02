const mongoose = require('mongoose');

const fuelConsumptionSchema = new mongoose.Schema({
  company_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  optimized_route_id: { type: mongoose.Schema.Types.ObjectId, ref: 'OptimizedRoute' },
  vehicle_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  driver_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },

  distance_km:          { type: Number },
  mileage_kmpl:         { type: Number }, // km per litre
  fuel_consumed_liters: { type: Number },
  fuel_price_per_liter: { type: Number },
  fuel_cost:            { type: Number },
  fuel_saving:          { type: Number },
  co2_emission_kg:      { type: Number },

  vehicle_type:  { type: String },
  load_tons:     { type: Number },
  road_type:     { type: String, enum: ['highway', 'city', 'mixed'], default: 'mixed' },

  recorded_at: { type: Date, default: Date.now },
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

fuelConsumptionSchema.index({ company_id: 1, vehicle_id: 1 });
fuelConsumptionSchema.index({ company_id: 1, recorded_at: -1 });

module.exports = mongoose.model('FuelConsumption', fuelConsumptionSchema);
