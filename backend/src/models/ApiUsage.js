const mongoose = require('mongoose');

const ApiUsageSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  period_date:    { type: Date, required: true },
  period_type:    { type: String, enum: ['hourly','daily','weekly','monthly'], default: 'daily' },
  total_requests: { type: Number, default: 0 },
  success_count:  { type: Number, default: 0 },
  error_count:    { type: Number, default: 0 },
  avg_latency_ms: { type: Number, default: 0 },
  p95_latency_ms: { type: Number, default: 0 },
  top_endpoints:  [{ path: String, count: Number }],
  top_consumers:  [{ app_name: String, count: Number }],
  bandwidth_mb:   { type: Number, default: 0 },
}, { timestamps: true });

ApiUsageSchema.index({ company_id: 1, period_date: -1 });

module.exports = mongoose.model('ApiUsage', ApiUsageSchema);
