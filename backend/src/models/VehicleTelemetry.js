const mongoose = require('mongoose');

const vehicleTelemetrySchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fleet_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  device_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'IoTDevice' },
  vehicle_number:   { type: String, required: true },

  // GPS
  gps: {
    lat:       { type: Number },
    lng:       { type: Number },
    altitude:  { type: Number },
    heading:   { type: Number },
    accuracy:  { type: Number },
  },

  // Engine
  engine: {
    rpm:              { type: Number },
    coolant_temp:     { type: Number }, // °C
    oil_pressure:     { type: Number }, // kPa
    oil_temp:         { type: Number }, // °C
    engine_load:      { type: Number }, // %
    engine_hours:     { type: Number },
    idle_time_min:    { type: Number },
    throttle_pos:     { type: Number }, // %
    intake_air_temp:  { type: Number }, // °C
    maf_sensor:       { type: Number }, // g/s
  },

  // Motion
  motion: {
    speed:              { type: Number }, // km/h
    odometer:           { type: Number }, // km
    acceleration:       { type: Number }, // m/s²
    deceleration:       { type: Number }, // m/s²
    harsh_brake:        { type: Boolean, default: false },
    harsh_acceleration: { type: Boolean, default: false },
    harsh_turn:         { type: Boolean, default: false },
  },

  // Battery / Electrical
  electrical: {
    battery_voltage:  { type: Number }, // V
    battery_current:  { type: Number }, // A
    alternator_output:{ type: Number }, // V
    charging_status:  { type: String, enum: ['charging','discharging','idle','fault'] },
  },

  // Fuel
  fuel: {
    level_pct:     { type: Number }, // %
    level_liters:  { type: Number },
    consumption_rate: { type: Number }, // L/100km
    tank_capacity: { type: Number },
  },

  // Tyres (FL, FR, RL, RR)
  tyres: {
    fl_pressure: { type: Number }, // PSI
    fr_pressure: { type: Number },
    rl_pressure: { type: Number },
    rr_pressure: { type: Number },
    fl_temp:     { type: Number }, // °C
    fr_temp:     { type: Number },
    rl_temp:     { type: Number },
    rr_temp:     { type: Number },
  },

  // Environment
  environment: {
    ambient_temp: { type: Number },
    humidity:     { type: Number },
  },

  // DTC codes
  dtc_codes: [{ type: String }],

  // Signal quality
  signal_strength: { type: Number },
  recorded_at:     { type: Date, default: Date.now, required: true },
}, { timestamps: true });

vehicleTelemetrySchema.index({ company_id: 1, fleet_vehicle_id: 1, recorded_at: -1 });
vehicleTelemetrySchema.index({ company_id: 1, vehicle_number: 1, recorded_at: -1 });
vehicleTelemetrySchema.index({ recorded_at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // 90-day TTL

module.exports = mongoose.model('VehicleTelemetry', vehicleTelemetrySchema);
