const mongoose = require('mongoose');
const { Schema } = mongoose;

const actionSchema = new Schema({
  action:  { type: String, enum: ['approved', 'rejected'] },
  by:      { type: Schema.Types.ObjectId, ref: 'User' },
  by_name: String,
  at:      Date,
  note:    String,
}, { _id: false });

const discountRequestSchema = new Schema({
  quote_number:      { type: String, required: true },
  quote_id:          { type: Schema.Types.ObjectId, ref: 'Quote' },
  company_id:        { type: Schema.Types.ObjectId, ref: 'Company' },
  requested_by:      { type: Schema.Types.ObjectId, ref: 'User' },
  requested_by_name: String,

  discount_type:    { type: String, enum: ['percentage', 'flat'], required: true },
  discount_value:   { type: Number, required: true },
  original_total:   Number,
  discounted_total: Number,
  reason:           { type: String, required: true },

  status: {
    type: String,
    enum: ['pending_manager', 'pending_regional', 'approved', 'rejected'],
    default: 'pending_manager',
  },

  manager_action:  actionSchema,
  regional_action: actionSchema,
}, { timestamps: true });

discountRequestSchema.index({ company_id: 1, status: 1, createdAt: -1 });
discountRequestSchema.index({ quote_number: 1 });
discountRequestSchema.index({ requested_by: 1 });

module.exports = mongoose.model('DiscountRequest', discountRequestSchema);
