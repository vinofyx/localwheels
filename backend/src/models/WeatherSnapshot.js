const mongoose = require('mongoose');

const weatherSnapshotSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  location_key: { type: String }, // lat,lng rounded to 2 decimals
  lat:          { type: Number },
  lng:          { type: Number },
  city:         { type: String },

  condition:    { type: String }, // 'clear', 'rain', 'storm', 'fog', etc.
  temperature:  { type: Number }, // Celsius
  humidity:     { type: Number }, // %
  wind_speed:   { type: Number }, // km/h
  visibility:   { type: Number }, // km

  alerts: [{
    type:     { type: String },   // 'rain', 'storm', 'flood', 'heat', 'wind'
    severity: { type: String, enum: ['watch', 'warning', 'emergency'] },
    message:  { type: String },
  }],

  driving_risk: { type: String, enum: ['low', 'medium', 'high', 'extreme'], default: 'low' },
  source:       { type: String, default: 'estimated' }, // 'openweather', 'estimated'
  fetched_at:   { type: Date, default: Date.now },
  expires_at:   { type: Date },
}, { timestamps: true });

// TTL — weather data expires after 1 hour
weatherSnapshotSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
weatherSnapshotSchema.index({ location_key: 1 });

module.exports = mongoose.model('WeatherSnapshot', weatherSnapshotSchema);
