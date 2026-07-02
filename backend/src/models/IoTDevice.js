const mongoose = require('mongoose');

const iotDeviceSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fleet_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle' },
  vehicle_number:   { type: String },

  device_id:      { type: String, required: true, unique: true }, // hardware identifier
  device_type:    { type: String, enum: ['gps_tracker','obd2','can_bus','telematics_unit','sensor_hub'], default: 'telematics_unit' },
  firmware_version: { type: String },
  hardware_version: { type: String },
  sim_number:     { type: String },
  imei:           { type: String },

  // Auth
  api_key:        { type: String, required: true },
  api_key_hash:   { type: String },

  // Status
  status:         { type: String, enum: ['online','offline','idle','error','unregistered'], default: 'unregistered' },
  is_active:      { type: Boolean, default: true },
  last_seen:      { type: Date },
  last_heartbeat: { type: Date },
  last_telemetry: { type: Date },

  // Health
  battery_level:    { type: Number }, // device battery %
  signal_strength:  { type: Number },
  telemetry_count:  { type: Number, default: 0 },
  error_count:      { type: Number, default: 0 },
  last_error:       { type: String },

  // Config
  config: {
    telemetry_interval_sec: { type: Number, default: 30 },
    gps_interval_sec:       { type: Number, default: 10 },
    heartbeat_interval_sec: { type: Number, default: 60 },
    offline_threshold_min:  { type: Number, default: 5 },
  },

  installed_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  installed_at:  { type: Date },
  notes:         { type: String },
}, { timestamps: true });

iotDeviceSchema.index({ company_id: 1, status: 1 });
iotDeviceSchema.index({ fleet_vehicle_id: 1 });
iotDeviceSchema.index({ last_seen: 1 });

module.exports = mongoose.model('IoTDevice', iotDeviceSchema);
