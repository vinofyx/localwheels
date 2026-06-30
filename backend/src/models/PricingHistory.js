const mongoose = require('mongoose');
const { Schema } = mongoose;

const pricingHistorySchema = new Schema({
  company_id:      { type: Schema.Types.ObjectId, ref: 'Company' },
  version:         { type: Number, default: 1 },
  changed_by:      { type: Schema.Types.ObjectId, ref: 'User' },
  changed_by_name: String,
  change_reason:   String,
  rules_snapshot:  [Schema.Types.Mixed],
  vehicle_count:   Number,
}, { timestamps: true });

pricingHistorySchema.index({ company_id: 1, createdAt: -1 });

module.exports = mongoose.model('PricingHistory', pricingHistorySchema);
