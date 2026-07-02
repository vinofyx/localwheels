const mongoose = require('mongoose');
const crypto   = require('crypto');

const ApiKeySchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  application_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'ApiApplication' },
  name:          { type: String, required: true },
  key_hash:      { type: String, unique: true },
  key_prefix:    { type: String },
  scopes:        [{ type: String }],
  environment:   { type: String, enum: ['production','staging','development'], default: 'production' },
  status:        { type: String, enum: ['active','revoked','expired'], default: 'active' },
  expires_at:    { type: Date },
  last_used_at:  { type: Date },
  usage_count:   { type: Number, default: 0 },
  allowed_ips:   [{ type: String }],
  rate_limit:    { type: Number, default: 1000 },
  created_by:    { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

ApiKeySchema.pre('save', function(next) {
  if (!this.key_hash) {
    const raw = `lw_${crypto.randomBytes(24).toString('hex')}`;
    this.key_prefix = raw.substring(0, 10);
    this.key_hash   = crypto.createHash('sha256').update(raw).digest('hex');
    this._rawKey    = raw; // temporary, not saved
  }
  next();
});

module.exports = mongoose.model('ApiKey', ApiKeySchema);
