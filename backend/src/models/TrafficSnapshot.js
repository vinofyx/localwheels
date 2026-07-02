const mongoose = require('mongoose');

const trafficSnapshotSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  route_key:    { type: String }, // origin_lat,origin_lng→dest_lat,dest_lng
  origin_lat:   { type: Number },
  origin_lng:   { type: Number },
  dest_lat:     { type: Number },
  dest_lng:     { type: Number },

  congestion_level: { type: String, enum: ['low', 'moderate', 'high', 'severe'], default: 'low' },
  delay_minutes:    { type: Number, default: 0 },
  incidents:        [{ type: String }],
  road_closures:    [{ type: String }],
  construction:     [{ type: String }],
  is_peak_hour:     { type: Boolean, default: false },

  source:       { type: String, default: 'estimated' }, // 'google', 'osm', 'estimated'
  fetched_at:   { type: Date, default: Date.now },
  expires_at:   { type: Date },
}, { timestamps: true });

// TTL — traffic data expires after 30 minutes
trafficSnapshotSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
trafficSnapshotSchema.index({ route_key: 1 });

module.exports = mongoose.model('TrafficSnapshot', trafficSnapshotSchema);
