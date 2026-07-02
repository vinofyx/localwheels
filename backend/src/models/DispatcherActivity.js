const mongoose = require('mongoose');

const dispatcherActivitySchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  dispatcher_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dispatcher_name:  { type: String, required: true },

  resource_type:     { type: String, enum: ['dispatch_plan','trip','manifest'], required: true },
  resource_id:         { type: mongoose.Schema.Types.ObjectId, required: true },
  action:                { type: String, enum: ['viewing','editing','locked','released'], required: true },
  expires_at:             Date, // soft lock TTL for collaboration
}, { timestamps: true });

dispatcherActivitySchema.index({ company_id: 1, resource_type: 1, resource_id: 1 });
dispatcherActivitySchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('DispatcherActivity', dispatcherActivitySchema);
