const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: { type: String, trim: true },
  hsn_code:    { type: String, trim: true },
  quantity:    { type: Number, default: 1 },
  rate:        { type: Number, default: 0 },
  amount:      { type: Number, default: 0 },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  invoice_number:   { type: String, required: true, unique: true, uppercase: true },
  invoice_date:     { type: Date, default: Date.now },
  shipment_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  lr_number:        { type: String, trim: true },
  customer_name:    { type: String, required: true, trim: true },
  customer_gst:     { type: String, trim: true, uppercase: true },
  customer_address: { type: String, trim: true },
  customer_phone:   { type: String, trim: true },
  line_items:       [lineItemSchema],
  subtotal:         { type: Number, default: 0 },
  cgst_percent:     { type: Number, default: 9 },
  cgst:             { type: Number, default: 0 },
  sgst_percent:     { type: Number, default: 9 },
  sgst:             { type: Number, default: 0 },
  igst_percent:     { type: Number, default: 0 },
  igst:             { type: Number, default: 0 },
  total:            { type: Number, default: 0 },
  status:           { type: String, enum: ['draft', 'issued', 'paid', 'cancelled'], default: 'draft' },
  due_date:         { type: Date },
  paid_date:        { type: Date },
  notes:            { type: String },
  created_by:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

invoiceSchema.index({ company_id: 1, status: 1 });
invoiceSchema.index({ company_id: 1, invoice_number: 1 });
invoiceSchema.index({ company_id: 1, branch_id: 1, createdAt: -1 });
invoiceSchema.index({ shipment_id: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
