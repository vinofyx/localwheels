const mongoose = require('mongoose');

const knowledgeArticleSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

  title:    { type: String, required: true },
  slug:     { type: String },
  content:  { type: String, required: true },
  summary:  { type: String },

  category: {
    type: String,
    enum: ['Shipment','Payment','Driver','Vehicle','Tracking','Account','General','Policy'],
    default: 'General',
  },
  tags:  [{ type: String }],

  // Links to complaint types this article resolves
  related_complaint_types: [{ type: String }],

  // Usage stats
  views:          { type: Number, default: 0 },
  helpful_count:  { type: Number, default: 0 },
  not_helpful_count: { type: Number, default: 0 },
  ai_used_count:  { type: Number, default: 0 }, // times AI recommended this

  is_published: { type: Boolean, default: true },
  is_internal:  { type: Boolean, default: false }, // agent-only articles

  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

knowledgeArticleSchema.index({ company_id: 1, is_published: 1 });
knowledgeArticleSchema.index({ company_id: 1, category: 1 });
// Text search index for knowledge base search
knowledgeArticleSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('KnowledgeArticle', knowledgeArticleSchema);
