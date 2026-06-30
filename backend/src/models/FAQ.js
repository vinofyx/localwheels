const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }, // null = global
  question:      { type: String, required: true, trim: true },
  answer:        { type: String, required: true, trim: true },
  category:      { type: String, trim: true, default: 'General' },
  tags:          [{ type: String, lowercase: true, trim: true }],
  helpful_yes:   { type: Number, default: 0 },
  helpful_no:    { type: Number, default: 0 },
  view_count:    { type: Number, default: 0 },
  is_published:  { type: Boolean, default: true },
  sort_order:    { type: Number, default: 0 },
  created_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

faqSchema.index({ company_id: 1, is_published: 1 });
faqSchema.index({ company_id: 1, category: 1 });
faqSchema.index({ tags: 1 });
faqSchema.index({ question: 'text', answer: 'text' }); // full-text search

module.exports = mongoose.model('FAQ', faqSchema);
