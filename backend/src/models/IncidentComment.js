const mongoose = require('mongoose');
const s = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  incident_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', required: true },
  author_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  author_name: String,
  text:        { type: String, required: true },
  type:        { type: String, enum: ['comment','update','escalation','resolution'], default: 'comment' },
  attachments: [{ name: String, url: String }],
}, { timestamps: true });
s.index({ company_id: 1, incident_id: 1, createdAt: -1 });
module.exports = mongoose.model('IncidentComment', s);
