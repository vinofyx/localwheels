const mongoose = require('mongoose');
const lineSchema = new mongoose.Schema({
  account_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'ChartOfAccount', required: true },
  account_code: { type: String },
  account_name: { type: String },
  debit:        { type: Number, default: 0 },
  credit:       { type: Number, default: 0 },
  description:  { type: String },
}, { _id: false });
const s = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  journal_no:   { type: String, required: true, trim: true, uppercase: true },
  journal_date: { type: Date, default: Date.now },
  description:  { type: String, required: true },
  lines:        [lineSchema],
  total_debit:  { type: Number, default: 0 },
  total_credit: { type: Number, default: 0 },
  is_balanced:  { type: Boolean, default: false },
  status:       { type: String, enum: ['draft','posted','reversed'], default: 'draft' },
  reference_type: { type: String, enum: ['manual','invoice','payment','expense','bank','adjustment','opening','closing','other'] },
  reference_id: { type: mongoose.Schema.Types.ObjectId },
  financial_year: { type: String },
  is_locked:    { type: Boolean, default: false },
  posted_at:    { type: Date },
  posted_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reversed_at:  { type: Date },
  reversed_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reversal_journal_id: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
  created_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
s.index({ company_id: 1, journal_no: 1 }, { unique: true });
s.index({ company_id: 1, journal_date: -1 });
s.index({ company_id: 1, status: 1 });
s.index({ reference_id: 1 });
module.exports = mongoose.model('JournalEntry', s);
