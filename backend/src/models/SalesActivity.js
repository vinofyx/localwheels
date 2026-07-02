const mongoose = require('mongoose');

const salesActivitySchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  lead_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  opportunity_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },

  type: {
    type: String,
    enum: ['note','call','email','whatsapp','meeting','stage_change','score_update','followup','proposal_sent','quote_sent','won','lost','created','assigned'],
    required: true,
  },
  description: { type: String, required: true },
  metadata:    { type: mongoose.Schema.Types.Mixed },

  performed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

salesActivitySchema.index({ company_id: 1, lead_id: 1 });
salesActivitySchema.index({ company_id: 1, opportunity_id: 1 });
salesActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('SalesActivity', salesActivitySchema);
