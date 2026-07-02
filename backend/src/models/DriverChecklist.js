const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  item:     { type: String, required: true },
  category: { type: String, enum: ['vehicle', 'documents', 'cargo', 'safety', 'other'], default: 'vehicle' },
  checked:  { type: Boolean, default: false },
  note:     { type: String },
}, { _id: false });

const driverChecklistSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  driver_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  trip_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },

  type:   { type: String, enum: ['pre_trip', 'post_trip', 'loading', 'delivery'], default: 'pre_trip' },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },
  items:  [checklistItemSchema],

  completed_at: { type: Date },
  signature:    { type: String },
  photos:       [{ type: String }],
  notes:        { type: String },
  submitted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

driverChecklistSchema.index({ company_id: 1, driver_id: 1, trip_id: 1 });

module.exports = mongoose.model('DriverChecklist', driverChecklistSchema);
