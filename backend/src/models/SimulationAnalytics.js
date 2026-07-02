const mongoose = require('mongoose');

const simulationAnalyticsSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  period_date:      { type: Date, required: true },
  period_type:      { type: String, enum: ['daily','weekly','monthly'], default: 'daily' },
  total_simulations:{ type: Number, default: 0 },
  completed_sims:   { type: Number, default: 0 },
  failed_sims:      { type: Number, default: 0 },
  avg_duration_ms:  { type: Number, default: 0 },
  scenarios_created:{ type: Number, default: 0 },
  decisions_made:   { type: Number, default: 0 },
  decisions_approved:{ type: Number, default: 0 },
  decisions_rejected:{ type: Number, default: 0 },
  total_saving_inr: { type: Number, default: 0 },
  carbon_saved_kg:  { type: Number, default: 0 },
  risk_mitigations: { type: Number, default: 0 },
  recommendations_generated: { type: Number, default: 0 },
  recommendations_accepted:  { type: Number, default: 0 },
  top_sim_types:    [{ type: String, count: Number }],
  accuracy_metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

simulationAnalyticsSchema.index({ company_id: 1, period_date: -1 });
module.exports = mongoose.model('SimulationAnalytics', simulationAnalyticsSchema);
