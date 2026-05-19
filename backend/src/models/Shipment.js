const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  lr_number: { type: String, required: true, unique: true, uppercase: true },
  sender_name: { type: String, required: true },
  sender_phone: String,
  sender_address: String,
  receiver_name: { type: String, required: true },
  receiver_phone: String,
  receiver_address: String,
  destination: { type: String, required: true },
  weight: { type: Number, default: 0 },
  packages: { type: Number, default: 1 },
  description: String,
  freight_amount: { type: Number, default: 0 },
  payment_type: { type: String, enum: ['topay', 'paid', 'fob', 'tbb'], default: 'topay' },
  status: {
    type: String,
    enum: ['booked', 'in_transit', 'out_for_delivery', 'delivered', 'hold', 'lost', 'returned'],
    default: 'booked',
  },
  short_qty: { type: Number, default: 0 },
  damage_qty: { type: Number, default: 0 },
  eway_bill: String,
  eway_bill_expiry: Date,
  booking_date: { type: Date, default: Date.now },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

shipmentSchema.index({ company_id: 1, branch_id: 1, status: 1 });
shipmentSchema.index({ company_id: 1, lr_number: 1 });

module.exports = mongoose.model('Shipment', shipmentSchema);
