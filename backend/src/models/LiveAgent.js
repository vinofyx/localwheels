const mongoose = require('mongoose');

const liveAgentSchema = new mongoose.Schema({
  user_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  display_name:     { type: String, trim: true },
  status:           { type: String, enum: ['online', 'offline', 'busy'], default: 'offline' },
  max_sessions:     { type: Number, default: 3 },
  active_sessions:  { type: Number, default: 0 },
  total_handled:    { type: Number, default: 0 },
  avg_rating:       { type: Number, default: 0 },
  rating_count:     { type: Number, default: 0 },
  last_active:      { type: Date },
}, { timestamps: true });

liveAgentSchema.index({ company_id: 1, status: 1 });
liveAgentSchema.index({ user_id: 1 });

module.exports = mongoose.model('LiveAgent', liveAgentSchema);
