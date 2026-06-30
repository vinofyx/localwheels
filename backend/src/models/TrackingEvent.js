const mongoose = require('mongoose');

const trackingEventSchema = new mongoose.Schema({
  shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  event_type:  {
    type: String,
    enum: ['booked', 'picked_up', 'in_transit', 'at_hub', 'out_for_delivery', 'delivered', 'exception', 'hold', 'returned'],
    required: true,
  },
  location:    { type: String, trim: true },
  description: { type: String, trim: true },
  event_time:  { type: Date, default: Date.now },
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

trackingEventSchema.index({ shipment_id: 1, event_time: -1 });
trackingEventSchema.index({ company_id: 1, event_time: -1 });

module.exports = mongoose.model('TrackingEvent', trackingEventSchema);
