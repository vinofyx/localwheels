const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role:      { type: String, enum: ['user', 'assistant'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const chatSessionSchema = new mongoose.Schema({
  session_id:  { type: String, required: true, unique: true },
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  messages:    [messageSchema],
  tools_used:  [{ type: String }],
  resolved:    { type: Boolean, default: false },
  lr_numbers:  [{ type: String }],
  metadata:    { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

chatSessionSchema.index({ session_id: 1 });
chatSessionSchema.index({ company_id: 1, createdAt: -1 });
chatSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // 30-day TTL

module.exports = mongoose.model('ChatSession', chatSessionSchema);
