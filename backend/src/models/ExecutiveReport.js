const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  report_type:  { type: String, enum: ['executive','ceo','coo','finance','operations','fleet','sales','customer','document','branch'], required: true },
  title:        { type: String, required: true },
  period:       { type: String },
  period_from:  { type: Date },
  period_to:    { type: Date },
  status:       { type: String, enum: ['generating','ready','failed'], default: 'generating' },
  generated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sections:     [{ title: String, content: String, data: mongoose.Schema.Types.Mixed }],
  ai_summary:   { type: String },
  file_path:    { type: String },
  format:       { type: String, enum: ['pdf','excel','csv','json'], default: 'json' },
  download_count: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ExecutiveReport', schema);
