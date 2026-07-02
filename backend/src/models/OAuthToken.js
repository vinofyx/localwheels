const mongoose = require('mongoose');
const crypto   = require('crypto');

const OAuthTokenSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  application_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiApplication' },
  user_id:        { type: mongoose.Schema.Types.ObjectId },
  token_type:     { type: String, enum: ['access','refresh','authorization_code'], default: 'access' },
  token_hash:     { type: String, unique: true },
  scopes:         [{ type: String }],
  expires_at:     { type: Date },
  revoked:        { type: Boolean, default: false },
  revoked_at:     { type: Date },
  last_used_at:   { type: Date },
  client_id:      { type: String },
  ip_address:     { type: String },
}, { timestamps: true });

OAuthTokenSchema.pre('save', function(next) {
  if (!this.token_hash) {
    const raw = crypto.randomBytes(32).toString('hex');
    this.token_hash = crypto.createHash('sha256').update(raw).digest('hex');
    this._rawToken  = raw;
  }
  next();
});

module.exports = mongoose.model('OAuthToken', OAuthTokenSchema);
