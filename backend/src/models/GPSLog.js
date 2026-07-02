const mongoose = require('mongoose');

const gpsLogSchema = new mongoose.Schema({
  shipment_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  vehicle_number: String,
  driver_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  lat:            { type: Number, required: true },
  lng:            { type: Number, required: true },
  speed_kmh:      { type: Number, default: 0 },
  heading:        Number,
  accuracy:       Number,
  recorded_at:    { type: Date, default: Date.now },
});

gpsLogSchema.index({ recorded_at: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });
gpsLogSchema.index({ shipment_id: 1, recorded_at: -1 });
gpsLogSchema.index({ company_id: 1, recorded_at: -1 });

module.exports = mongoose.model('GPSLog', gpsLogSchema);
