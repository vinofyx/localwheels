const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  lr_number:    { type: String, required: true, unique: true, uppercase: true },
  awb_number:   { type: String, unique: true, sparse: true, uppercase: true },

  sender_name:    { type: String, required: true },
  sender_phone:   String,
  sender_address: String,

  receiver_name:    { type: String, required: true },
  receiver_phone:   String,
  receiver_address: String,

  destination:   { type: String, required: true },
  weight:        { type: Number, default: 0 },
  packages:      { type: Number, default: 1 },
  description:   String,
  freight_amount: { type: Number, default: 0 },
  payment_type:  { type: String, enum: ['topay', 'paid', 'fob', 'tbb'], default: 'topay' },

  status: {
    type: String,
    enum: [
      'booked', 'in_transit', 'out_for_delivery', 'delivered', 'hold', 'lost', 'returned',
      'booking_confirmed', 'pickup_scheduled', 'driver_assigned', 'vehicle_arrived',
      'picked_up', 'reached_warehouse', 'warehouse_processing', 'dispatched',
      'reached_hub', 'delivery_failed', 'cancelled',
    ],
    default: 'booked',
  },

  vehicle_number:  String,
  driver_name:     String,
  driver_phone:    String,
  driver_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  vehicle_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },

  current_hub:           String,
  current_location_name: String,
  current_lat:           Number,
  current_lng:           Number,
  last_gps_update:       Date,

  eta_date:        Date,
  eta_confidence:  { type: Number, min: 0, max: 100 },

  short_qty:         { type: Number, default: 0 },
  damage_qty:        { type: Number, default: 0 },
  eway_bill:         String,
  eway_bill_expiry:  Date,
  booking_date:      { type: Date, default: Date.now },
  delivery_date:     Date,
  created_by:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

shipmentSchema.index({ company_id: 1, branch_id: 1, status: 1 });
shipmentSchema.index({ company_id: 1, lr_number: 1 });
shipmentSchema.index({ sender_phone: 1 }, { sparse: true });
shipmentSchema.index({ receiver_phone: 1 }, { sparse: true });

module.exports = mongoose.model('Shipment', shipmentSchema);
