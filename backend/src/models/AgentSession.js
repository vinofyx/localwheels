const mongoose = require('mongoose');

const agentMessageSchema = new mongoose.Schema({
  from:      { type: String, enum: ['customer', 'agent', 'system'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read:      { type: Boolean, default: false },
}, { _id: false });

const agentSessionSchema = new mongoose.Schema({
  company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  session_id:       { type: String, required: true, unique: true },
  chat_session_id:  { type: String }, // originating chat session
  agent_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Customer info
  customer_name:    { type: String, trim: true },
  customer_phone:   { type: String, trim: true },
  customer_email:   { type: String, trim: true },
  lr_number:        { type: String, trim: true },
  issue_summary:    { type: String, trim: true },
  channel:          { type: String, enum: ['website', 'mobile', 'whatsapp', 'voice'], default: 'website' },

  // AI context — last N messages before handoff
  ai_transcript:    [{ role: String, content: String }],

  // Live messages between customer and agent
  messages:         [agentMessageSchema],

  status:           { type: String, enum: ['waiting', 'active', 'closed', 'missed'], default: 'waiting' },
  priority:         { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },

  // Timings
  accepted_at:      { type: Date },
  closed_at:        { type: Date },
  first_response_ms: { type: Number }, // time-to-first-response

  // Resolution
  resolution_note:  { type: String },
  csat_rating:      { type: Number, min: 1, max: 5 },
  csat_comment:     { type: String },
}, { timestamps: true });

agentSessionSchema.index({ company_id: 1, status: 1 });
agentSessionSchema.index({ agent_id: 1, status: 1 });
agentSessionSchema.index({ session_id: 1 });
agentSessionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AgentSession', agentSessionSchema);
