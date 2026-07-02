const mongoose = require('mongoose');

const salesAnalyticsSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  period:      { type: String, enum: ['daily','weekly','monthly'], default: 'daily' },
  period_date: { type: Date, required: true },

  // Volume
  total_leads:       { type: Number, default: 0 },
  qualified_leads:   { type: Number, default: 0 },
  won_deals:         { type: Number, default: 0 },
  lost_deals:        { type: Number, default: 0 },
  conversion_rate:   { type: Number, default: 0 },
  win_rate:          { type: Number, default: 0 },

  // Revenue
  total_pipeline:    { type: Number, default: 0 },
  won_revenue:       { type: Number, default: 0 },
  avg_deal_size:     { type: Number, default: 0 },

  // Activity
  total_meetings:    { type: Number, default: 0 },
  total_proposals:   { type: Number, default: 0 },
  total_followups:   { type: Number, default: 0 },

  // Breakdown
  by_source:         { type: mongoose.Schema.Types.Mixed, default: {} },
  by_stage:          { type: mongoose.Schema.Types.Mixed, default: {} },
  by_service:        { type: mongoose.Schema.Types.Mixed, default: {} },
  by_executive:      { type: mongoose.Schema.Types.Mixed, default: {} },
  lost_reasons:      { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

salesAnalyticsSchema.index({ company_id: 1, period: 1, period_date: -1 }, { unique: true });

module.exports = mongoose.model('SalesAnalytics', salesAnalyticsSchema);
