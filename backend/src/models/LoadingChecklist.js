const mongoose = require('mongoose');

const loadingChecklistSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  trip_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  manifest_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchManifest' },
  vehicle_number: { type: String },
  driver_name:    { type: String },

  // Shipment-level checks
  items: [{
    lr_number:      { type: String },
    shipment_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
    packages_expected: { type: Number },
    packages_loaded:   { type: Number },
    weight_expected:   { type: Number },
    weight_actual:     { type: Number },
    is_loaded:         { type: Boolean, default: false },
    damage_noted:      { type: Boolean, default: false },
    damage_description:{ type: String },
  }],

  // Vehicle pre-dispatch checks
  vehicle_checks: {
    fuel_level:       { type: String, enum: ['ok','low','critical'], default: 'ok' },
    tyre_condition:   { type: String, enum: ['ok','warning','fail'], default: 'ok' },
    documents_present:{ type: Boolean, default: true },
    cleanliness:      { type: String, enum: ['ok','poor'], default: 'ok' },
    load_secured:     { type: Boolean, default: false },
  },

  overall_status: { type: String, enum: ['pending','in_progress','complete','issue'], default: 'pending' },
  started_at:     { type: Date },
  completed_at:   { type: Date },
  notes:          { type: String },
  completed_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

loadingChecklistSchema.index({ company_id: 1, trip_id: 1 });

module.exports = mongoose.model('LoadingChecklist', loadingChecklistSchema);
