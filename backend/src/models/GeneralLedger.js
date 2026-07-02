const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  account_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount', required: true },
  account_code: { type: String },
  journal_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry', required: true },
  entry_date:   { type: Date, default: Date.now },
  description:  { type: String },
  debit:        { type: Number, default: 0 },
  credit:       { type: Number, default: 0 },
  balance:      { type: Number, default: 0 },
  reference_type: { type: String },
  reference_id: { type: mongoose.Schema.Types.ObjectId },
  financial_year: { type: String },
}, { timestamps: true });
s.index({ company_id: 1, account_id: 1, entry_date: -1 });
s.index({ company_id: 1, journal_id: 1 });
s.index({ company_id: 1, entry_date: -1 });
module.exports = mongoose.model('GeneralLedger', s);
