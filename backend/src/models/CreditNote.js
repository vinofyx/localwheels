const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  credit_note_no:{ type: String, required: true, trim: true, uppercase: true },
  cn_date:       { type: Date, default: Date.now },
  invoice_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  invoice_number:{ type: String },
  customer_name: { type: String, required: true },
  customer_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  reason:        { type: String, required: true },
  line_items:    [{ description: String, quantity: Number, rate: Number, amount: Number }],
  subtotal:      { type: Number, default: 0 },
  tax_amount:    { type: Number, default: 0 },
  total:         { type: Number, default: 0 },
  status:        { type: String, enum: ['draft','issued','applied','cancelled'], default: 'draft' },
  applied_amount:{ type: Number, default: 0 },
  branch_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
s.index({ company_id: 1, credit_note_no: 1 }, { unique: true });
s.index({ company_id: 1, status: 1 });
s.index({ company_id: 1, invoice_id: 1 });
module.exports = mongoose.model('CreditNote', s);
