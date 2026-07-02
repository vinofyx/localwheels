const mongoose = require('mongoose');

const maintenancePredictionSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  fleet_vehicle_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  vehicle_number:   { type: String },

  // What needs maintenance
  component: {
    type: String,
    enum: [
      'engine','brakes','battery','tyre','oil','coolant','clutch',
      'transmission','suspension','alternator','fuel_system',
      'air_filter','fuel_filter','spark_plugs','timing_belt','other'
    ],
    required: true,
  },
  failure_type:     { type: String }, // e.g. "Brake wear", "Oil degradation"
  maintenance_type: { type: String }, // maps to VehicleMaintenance.maintenance_type

  // AI Prediction
  failure_probability: { type: Number, min: 0, max: 1, required: true },
  confidence_score:    { type: Number, min: 0, max: 1 },
  severity:            { type: String, enum: ['low','medium','high','critical'], default: 'medium' },

  // Timing
  predicted_failure_date: { type: Date },
  days_until_failure:     { type: Number },
  km_until_failure:       { type: Number },
  remaining_useful_life:  { type: Number }, // days

  // Evidence
  contributing_factors: [{
    factor:      { type: String },
    weight:      { type: Number },
    observation: { type: String },
  }],
  sensor_anomalies: [{
    sensor:  { type: String },
    value:   { type: Number },
    normal:  { type: String },
    status:  { type: String },
  }],

  // AI output
  ai_explanation:  { type: String },
  recommendation:  { type: String },
  estimated_cost:  { type: Number },

  // Status
  status:         { type: String, enum: ['active','scheduled','resolved','dismissed','expired'], default: 'active' },
  is_actioned:    { type: Boolean, default: false },
  work_order_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder' },

  predicted_at:   { type: Date, default: Date.now },
  resolved_at:    { type: Date },
  model_version:  { type: String, default: '1.0' },
}, { timestamps: true });

maintenancePredictionSchema.index({ company_id: 1, fleet_vehicle_id: 1, status: 1 });
maintenancePredictionSchema.index({ company_id: 1, severity: 1, status: 1 });
maintenancePredictionSchema.index({ predicted_failure_date: 1 });

module.exports = mongoose.model('MaintenancePrediction', maintenancePredictionSchema);
