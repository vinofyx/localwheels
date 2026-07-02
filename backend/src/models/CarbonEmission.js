const mongoose = require('mongoose');

const carbonEmissionSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  record_date:  { type: Date, required: true },
  period_type:  { type: String, enum: ['trip','daily','weekly','monthly'], default: 'daily' },
  source_type:  { type: String, enum: ['vehicle','warehouse','office','third_party'], default: 'vehicle' },
  entity_id:    { type: mongoose.Schema.Types.ObjectId },
  entity_ref:   { type: String },
  vehicle_type: { type: String },
  fuel_type:    { type: String, enum: ['diesel','petrol','cng','ev','hybrid'], default: 'diesel' },
  distance_km:  { type: Number, default: 0 },
  fuel_litres:  { type: Number, default: 0 },
  co2_kg:       { type: Number, default: 0 },
  nox_g:        { type: Number, default: 0 },
  pm_g:         { type: Number, default: 0 },
  co2_per_km:   { type: Number, default: 0 },
  co2_per_tonne_km: { type: Number, default: 0 },
  load_factor:  { type: Number, default: 0 },
  route_id:     { type: mongoose.Schema.Types.ObjectId },
  shipment_ids: [mongoose.Schema.Types.ObjectId],
  data_source:  { type: String, default: 'calculated' },
}, { timestamps: true });

carbonEmissionSchema.index({ company_id: 1, record_date: -1 });
module.exports = mongoose.model('CarbonEmission', carbonEmissionSchema);
