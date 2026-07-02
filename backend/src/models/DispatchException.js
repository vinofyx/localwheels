const mongoose = require('mongoose');

const dispatchExceptionSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  trip_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  dispatch_plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchPlan' },
  shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },

  exception_type: {
    type: String,
    enum: ['vehicle_breakdown','driver_absent','shipment_delay','customer_cancellation',
           'weather_alert','road_closure','overloaded','accident','fuel_shortage',
           'document_issue','other'],
    required: true,
  },
  severity: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  description: { type: String, required: true },

  // Location where exception occurred
  location:    { type: String },
  lat:         { type: Number },
  lng:         { type: Number },

  // AI resolution
  ai_actions:      [{ type: String }],
  ai_recommendation: { type: String },
  resolution:       { type: String },

  status: { type: String, enum: ['open','in_progress','resolved','escalated'], default: 'open' },
  escalated_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolved_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolved_at:  { type: Date },

  reported_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

dispatchExceptionSchema.index({ company_id: 1, status: 1 });
dispatchExceptionSchema.index({ company_id: 1, trip_id: 1 });

module.exports = mongoose.model('DispatchException', dispatchExceptionSchema);
