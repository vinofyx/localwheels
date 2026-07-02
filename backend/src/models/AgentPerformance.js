const mongoose = require('mongoose');

// Daily performance snapshot per agent
const agentPerformanceSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  agent_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  agent_name:  { type: String },
  period:      { type: String, enum: ['daily','weekly','monthly'], default: 'daily' },
  period_date: { type: Date, required: true },

  // Volume
  tickets_assigned:  { type: Number, default: 0 },
  tickets_resolved:  { type: Number, default: 0 },
  tickets_escalated: { type: Number, default: 0 },
  tickets_reopened:  { type: Number, default: 0 },

  // Speed
  avg_first_response_min: { type: Number },
  avg_resolution_min:     { type: Number },

  // SLA
  sla_met_count:      { type: Number, default: 0 },
  sla_breached_count: { type: Number, default: 0 },
  sla_compliance_pct: { type: Number, default: 0 },

  // Customer satisfaction
  avg_csat:           { type: Number },
  csat_responses:     { type: Number, default: 0 },

  // AI assistance
  ai_suggestions_used:   { type: Number, default: 0 },
  ai_suggestions_ignored:{ type: Number, default: 0 },

  computed_at: { type: Date, default: Date.now },
}, { timestamps: true });

agentPerformanceSchema.index({ company_id: 1, agent_id: 1, period: 1, period_date: -1 }, { unique: true });

module.exports = mongoose.model('AgentPerformance', agentPerformanceSchema);
