const mongoose = require('mongoose');

const apiRateLimitSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  application_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiApplication' },
  api_key_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'ApiKey' },
  identifier:     { type: String, required: true }, // ip, key_prefix, app_id, user_id
  identifier_type:{ type: String, enum: ['ip','api_key','application','user'], default: 'api_key' },
  endpoint:       { type: String },
  window_start:   { type: Date, required: true },
  window_seconds: { type: Number, default: 900 }, // 15min
  request_count:  { type: Number, default: 0 },
  limit:          { type: Number, default: 1000 },
  exceeded_at:    { type: Date },
  blocked_until:  { type: Date },
  is_blocked:     { type: Boolean, default: false },
  last_request_at:{ type: Date },
  total_blocked:  { type: Number, default: 0 },
}, {
  timestamps: true,
});

apiRateLimitSchema.index({ company_id: 1, identifier: 1, window_start: 1 }, { unique: true });
apiRateLimitSchema.index({ blocked_until: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('ApiRateLimit', apiRateLimitSchema);
