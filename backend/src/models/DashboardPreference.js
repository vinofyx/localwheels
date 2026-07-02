const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  layout:     { type: String, enum: ['executive','operations','finance','sales','driver'], default: 'executive' },
  pinned_kpis:  [String],
  hidden_widgets: [String],
  date_range:   { type: String, default: '30d' },
  auto_refresh:  { type: Number, default: 300 },
  theme:         { type: String, default: 'light' },
}, { timestamps: true });

schema.index({ user_id: 1, company_id: 1 }, { unique: true });
module.exports = mongoose.model('DashboardPreference', schema);
