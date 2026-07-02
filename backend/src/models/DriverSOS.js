const mongoose = require('mongoose');

const driverSOSSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  driver_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  trip_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },

  sos_number:  { type: String, unique: true },
  type:        { type: String, enum: ['medical', 'accident', 'robbery', 'breakdown', 'fire', 'other'], default: 'other' },
  status:      { type: String, enum: ['active', 'acknowledged', 'responding', 'resolved', 'false_alarm'], default: 'active' },

  lat:     { type: Number },
  lng:     { type: Number },
  address: { type: String },

  description: { type: String },
  voice_note:  { type: String },

  acknowledged_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledged_at: { type: Date },
  resolved_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolved_at:     { type: Date },
  resolution_notes:{ type: String },

  contacts_notified: [{ type: String }],
  triggered_at:      { type: Date, default: Date.now },
}, { timestamps: true });

driverSOSSchema.index({ company_id: 1, status: 1 });
driverSOSSchema.index({ driver_id: 1, createdAt: -1 });

module.exports = mongoose.model('DriverSOS', driverSOSSchema);
