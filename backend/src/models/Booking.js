const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  company_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:          { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  booking_number:     { type: String, required: true, unique: true, uppercase: true },
  sender_name:        { type: String, required: true, trim: true },
  sender_phone:       { type: String, trim: true },
  sender_address:     { type: String, trim: true },
  pickup_address:     { type: String, required: true, trim: true },
  pickup_date:        { type: Date },
  receiver_name:      { type: String, required: true, trim: true },
  receiver_phone:     { type: String, trim: true },
  receiver_address:   { type: String, trim: true },
  destination:        { type: String, required: true, trim: true },
  goods_description:  { type: String, trim: true },
  estimated_weight:   { type: Number, default: 0 },
  estimated_packages: { type: Number, default: 1 },
  service_type:       { type: String, enum: ['ftl', 'ptl', 'express', 'air', 'warehouse'], default: 'ptl' },
  status:             { type: String, enum: ['pending', 'confirmed', 'pickup_done', 'cancelled'], default: 'pending' },
  shipment_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  cancellation_reason:{ type: String },
  created_by:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

bookingSchema.index({ company_id: 1, status: 1 });
bookingSchema.index({ company_id: 1, booking_number: 1 });
bookingSchema.index({ company_id: 1, branch_id: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
