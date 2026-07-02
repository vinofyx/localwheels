const mongoose = require('mongoose');

const ApiAnalyticsSchema = new mongoose.Schema({
  company_id:          { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  period_date:         { type: Date, required: true },
  period_type:         { type: String, enum: ['daily','weekly','monthly'], default: 'daily' },
  total_api_calls:     { type: Number, default: 0 },
  successful_calls:    { type: Number, default: 0 },
  failed_calls:        { type: Number, default: 0 },
  avg_latency_ms:      { type: Number, default: 0 },
  webhook_deliveries:  { type: Number, default: 0 },
  webhook_successes:   { type: Number, default: 0 },
  webhook_failures:    { type: Number, default: 0 },
  connectors_active:   { type: Number, default: 0 },
  sync_jobs_total:     { type: Number, default: 0 },
  sync_jobs_success:   { type: Number, default: 0 },
  sync_records_total:  { type: Number, default: 0 },
  events_published:    { type: Number, default: 0 },
  events_delivered:    { type: Number, default: 0 },
  top_endpoints:       [{ path: String, count: Number, avg_ms: Number }],
  top_connectors:      [{ name: String, syncs: Number }],
  error_breakdown:     [{ code: Number, count: Number }],
}, { timestamps: true });

ApiAnalyticsSchema.index({ company_id: 1, period_date: -1 });

module.exports = mongoose.model('ApiAnalytics', ApiAnalyticsSchema);
