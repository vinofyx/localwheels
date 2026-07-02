const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  customer_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customer_name:{ type: String, required: true },
  customer_phone:{ type: String },
  entry_date:   { type: Date, default: Date.now },
  type:         { type: String, enum: ['invoice','payment','credit_note','debit_note','advance','adjustment'], required: true },
  reference_no: { type: String },
  reference_id: { type: mongoose.Schema.Types.ObjectId },
  description:  { type: String },
  debit:        { type: Number, default: 0 },
  credit:       { type: Number, default: 0 },
  balance:      { type: Number, default: 0 },
  financial_year: { type: String },
  branch_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
}, { timestamps: true });
s.index({ company_id: 1, customer_id: 1, entry_date: -1 });
s.index({ company_id: 1, customer_name: 1, entry_date: -1 });
s.index({ company_id: 1, entry_date: -1 });
module.exports = mongoose.model('CustomerLedger', s);
