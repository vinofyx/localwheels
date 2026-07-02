const mongoose = require('mongoose');

const podSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  shipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', required: true, unique: true },
  status: { type: String, enum: ['pending', 'uploaded', 'verified'], default: 'pending' },
  uploaded_file: String,
  receiver_name: String,
  delivery_date: Date,
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploaded_at: Date,
}, { timestamps: true });
podSchema.index({ company_id: 1, status: 1 });
podSchema.index({ company_id: 1, delivery_date: -1 });

module.exports = mongoose.model('POD', podSchema);
