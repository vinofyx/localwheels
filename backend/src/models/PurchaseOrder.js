const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  po_number:      { type: String, required: true },
  supplier_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  branch_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  warehouse_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  status:         { type: String, enum: ['draft','submitted','approved','partially_received','received','cancelled','closed'], default: 'draft' },
  priority:       { type: String, enum: ['low','medium','high','urgent'], default: 'medium' },
  items: [{
    sku:          String,
    description:  String,
    quantity:     { type: Number, default: 0 },
    unit_price:   { type: Number, default: 0 },
    total_price:  { type: Number, default: 0 },
    received_qty: { type: Number, default: 0 },
    unit:         String,
  }],
  subtotal:       { type: Number, default: 0 },
  tax_amount:     { type: Number, default: 0 },
  total_amount:   { type: Number, default: 0 },
  currency:       { type: String, default: 'KES' },
  expected_date:  Date,
  received_date:  Date,
  payment_terms:  String,
  payment_status: { type: String, enum: ['unpaid','partial','paid'], default: 'unpaid' },
  paid_amount:    { type: Number, default: 0 },
  approved_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at:    Date,
  created_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes:          String,
}, { timestamps: true });
s.index({ company_id: 1, po_number: 1 }, { unique: true });
module.exports = mongoose.model('PurchaseOrder', s);
