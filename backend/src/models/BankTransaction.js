const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  bank_account_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'BankAccount', required: true },
  transaction_date:{ type: Date, default: Date.now },
  description:    { type: String, required: true },
  type:           { type: String, enum: ['credit','debit'], required: true },
  amount:         { type: Number, required: true, default: 0 },
  balance:        { type: Number, default: 0 },
  reference_no:   { type: String },
  narration:      { type: String },
  is_reconciled:  { type: Boolean, default: false },
  reconciled_at:  { type: Date },
  reconciliation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BankReconciliation' },
  journal_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  source:         { type: String, enum: ['manual','import','bank_feed','payment','receipt'], default: 'manual' },
}, { timestamps: true });
s.index({ company_id: 1, bank_account_id: 1, transaction_date: -1 });
s.index({ company_id: 1, is_reconciled: 1 });
module.exports = mongoose.model('BankTransaction', s);
