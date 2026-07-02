const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  event_type:  { type: String, enum: ['shipment_update','vehicle_alert','warehouse_event','supplier_event','order_event','driver_event','route_event','weather_event','system_event'], default: 'system_event' },
  severity:    { type: String, enum: ['info','warning','critical'], default: 'info' },
  title:       String,
  description: String,
  entity_type: String,
  entity_id:   String,
  entity_ref:  String,
  location:    { lat: Number, lng: Number, city: String },
  handled:     { type: Boolean, default: false },
  handled_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  handled_at:  Date,
  metadata:    mongoose.Schema.Types.Mixed,
}, { timestamps: true });
s.index({ company_id: 1, handled: 1, createdAt: -1 });
module.exports = mongoose.model('ControlTowerEvent', s);
