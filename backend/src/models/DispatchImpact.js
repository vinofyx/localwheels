const mongoose = require('mongoose');

const dispatchImpactSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  trip_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  dispatch_plan_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchPlan' },

  change_type:          { type: String, enum: ['breakdown','weather_alert','cancellation','reassignment','delay','replan'], required: true },
  change_reason:           String,

  affected_shipment_ids:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' }],
  affected_customers:          [{
    customer_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customer_name:   String,
    customer_phone:    String,
    lr_number:           String,
    eta_delay_min:         Number,
    notified:                { type: Boolean, default: false },
  }],

  notifications_sent:           { type: Number, default: 0 },
}, { timestamps: true });

dispatchImpactSchema.index({ company_id: 1, createdAt: -1 });

module.exports = mongoose.model('DispatchImpact', dispatchImpactSchema);
