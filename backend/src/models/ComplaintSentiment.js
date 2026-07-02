const mongoose = require('mongoose');

const complaintSentimentSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  complaint_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint', required: true },
  state:         { type: String, enum: ['Very Angry','Angry','Neutral','Satisfied','Very Happy'], required: true },
  score:          { type: Number, min: -1, max: 1 },
  source:         { type: String, enum: ['initial','customer_reply','agent_note','feedback'], default: 'customer_reply' },
  message_excerpt: String,
}, { timestamps: true });

complaintSentimentSchema.index({ company_id: 1, complaint_id: 1, createdAt: 1 });

module.exports = mongoose.model('ComplaintSentiment', complaintSentimentSchema);
