const mongoose = require('mongoose');

const dispatcherShiftSchema = new mongoose.Schema({
  company_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  dispatcher_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dispatcher_name:   { type: String, required: true },

  shift_start:        { type: Date, required: true },
  shift_end:            Date,
  status:                { type: String, enum: ['active','ended'], default: 'active' },

  active_trip_ids:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }],
  pending_approval_ids:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'DispatchPlan' }],
  handover_notes:            String,
  handed_over_to:              { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  handed_over_to_name:          String,
}, { timestamps: true });

dispatcherShiftSchema.index({ company_id: 1, dispatcher_id: 1, status: 1 });
dispatcherShiftSchema.index({ company_id: 1, shift_start: -1 });

module.exports = mongoose.model('DispatcherShift', dispatcherShiftSchema);
