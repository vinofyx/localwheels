const mongoose = require('mongoose');

const driverIncidentSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  driver_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  trip_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  shipment_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' }],

  incident_number: { type: String, unique: true },
  type: {
    type: String,
    enum: ['breakdown', 'accident', 'delay', 'traffic', 'customer_unavailable', 'damaged_goods', 'emergency', 'fuel_shortage', 'route_issue', 'other'],
    required: true,
  },
  severity:    { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status:      { type: String, enum: ['reported', 'acknowledged', 'in_progress', 'resolved', 'escalated'], default: 'reported' },

  description: { type: String, required: true },
  lat:         { type: Number },
  lng:         { type: Number },
  address:     { type: String },

  photos:      [{ type: String }],
  voice_note:  { type: String },

  estimated_delay_min: { type: Number },
  ai_recommendation:   { type: String },
  ai_confidence:       { type: Number, min: 0, max: 100 },

  resolution_notes: { type: String },
  resolved_at:      { type: Date },
  resolved_by:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  reported_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reported_at:  { type: Date, default: Date.now },
}, { timestamps: true });

driverIncidentSchema.index({ company_id: 1, driver_id: 1, createdAt: -1 });
driverIncidentSchema.index({ company_id: 1, type: 1, status: 1 });

module.exports = mongoose.model('DriverIncident', driverIncidentSchema);
