const mongoose = require('mongoose');

const evChargingSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  vehicle_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  station_name:      String,
  station_location:  String,
  charge_start_at:   Date,
  charge_end_at:     Date,
  starting_charge_pct: Number,
  ending_charge_pct:  Number,
  units_kwh:          Number,
  cost:                Number,
  battery_health_pct:  Number,
  odometer_km:         Number,
}, { timestamps: true });

evChargingSchema.index({ company_id: 1, vehicle_id: 1, createdAt: -1 });

module.exports = mongoose.model('EVCharging', evChargingSchema);
