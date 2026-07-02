const mongoose = require('mongoose');

const ApiApplicationSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name:         { type: String, required: true },
  description:  { type: String },
  app_type:     { type: String, enum: ['internal','partner','public','developer'], default: 'internal' },
  status:       { type: String, enum: ['active','inactive','suspended'], default: 'active' },
  contact_email:{ type: String },
  website:      { type: String },
  logo_url:     { type: String },
  scopes:       [{ type: String }],
  allowed_ips:  [{ type: String }],
  rate_limit:   { type: Number, default: 1000 },
  rate_window:  { type: Number, default: 3600 },
  api_key_count:{ type: Number, default: 0 },
  total_requests:{ type: Number, default: 0 },
  created_by:   { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

module.exports = mongoose.model('ApiApplication', ApiApplicationSchema);
