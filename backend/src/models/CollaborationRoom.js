const mongoose = require('mongoose');
const msgSchema = new mongoose.Schema({
  sender_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sender_name: String,
  text:        String,
  type:        { type: String, enum: ['text','file','system'], default: 'text' },
  file_url:    String,
  sent_at:     { type: Date, default: Date.now },
}, { _id: true });

const s = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name:        { type: String, required: true },
  type:        { type: String, enum: ['general','operations','incident','dispatch','warehouse','management','private'], default: 'general' },
  description: String,
  members:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages:    { type: [msgSchema], default: [] },
  is_active:   { type: Boolean, default: true },
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pinned_message: String,
  incident_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
}, { timestamps: true });
module.exports = mongoose.model('CollaborationRoom', s);
