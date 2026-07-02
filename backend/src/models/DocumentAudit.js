const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  document_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

  action: {
    type: String,
    enum: ['uploaded','viewed','downloaded','ocr_started','ocr_completed','validated','approved',
           'rejected','correction_requested','moved','renamed','tagged','favorited','archived',
           'deleted','restored','version_created','shared','linked','unlinked','reprocessed'],
    required: true,
  },

  actor_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actor_name:  String,
  actor_role:  String,
  actor_ip:    String,

  details:     { type: mongoose.Schema.Types.Mixed },
  old_value:   { type: mongoose.Schema.Types.Mixed },
  new_value:   { type: mongoose.Schema.Types.Mixed },

  timestamp:   { type: Date, default: Date.now, index: true },
}, { timestamps: false });

auditSchema.index({ document_id: 1, timestamp: -1 });
auditSchema.index({ company_id: 1, action: 1, timestamp: -1 });
module.exports = mongoose.model('DocumentAudit', auditSchema);
