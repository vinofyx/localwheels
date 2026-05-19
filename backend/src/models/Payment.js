const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  amount: { type: Number, default: 0 },
  payment_type: { type: String, enum: ['topay', 'paid', 'fob', 'tbb'], default: 'topay' },
  status: { type: String, enum: ['pending', 'partial', 'paid', 'overdue'], default: 'pending' },
  due_date: Date,
  paid_date: Date,
}, { timestamps: true });

paymentSchema.index({ company_id: 1, branch_id: 1, status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
