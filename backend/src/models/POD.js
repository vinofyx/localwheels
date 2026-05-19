const mongoose = require('mongoose');

const podSchema = new mongoose.Schema({
  shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true, unique: true },
  status: { type: String, enum: ['pending', 'uploaded', 'verified'], default: 'pending' },
  uploaded_file: String,
  receiver_name: String,
  delivery_date: Date,
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploaded_at: Date,
}, { timestamps: true });

module.exports = mongoose.model('POD', podSchema);
