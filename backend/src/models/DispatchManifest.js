const mongoose = require('mongoose');

const manifestItemSchema = new mongoose.Schema({
  sequence:       { type: Number },
  shipment_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' },
  lr_number:      { type: String },
  sender_name:    { type: String },
  receiver_name:  { type: String },
  receiver_phone: { type: String },
  destination:    { type: String },
  weight_kg:      { type: Number },
  packages:       { type: Number },
  description:    { type: String },
  freight_amount: { type: Number },
  payment_type:   { type: String },
  eway_bill:      { type: String },
  pod_collected:  { type: Boolean, default: false },
}, { _id: false });

const dispatchManifestSchema = new mongoose.Schema({
  company_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  branch_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  trip_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  dispatch_plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchPlan' },

  manifest_number: { type: String, unique: true }, // MF-YYYYMMDD-NNNN
  qr_data:         { type: String },                // URL-encoded manifest reference

  // Vehicle & driver snapshot
  vehicle_number:  { type: String },
  vehicle_type:    { type: String },
  driver_name:     { type: String },
  driver_phone:    { type: String },
  driver_license:  { type: String },

  // Route snapshot
  origin:          { type: String },
  destinations:    [{ type: String }],
  total_distance_km: { type: Number },

  // Timing
  dispatch_time:   { type: Date },
  expected_delivery: { type: Date },

  // Load summary
  items:           [manifestItemSchema],
  total_items:     { type: Number, default: 0 },
  total_weight_kg: { type: Number, default: 0 },
  total_packages:  { type: Number, default: 0 },
  total_freight:   { type: Number, default: 0 },

  // Status
  status: { type: String, enum: ['generated','printed','acknowledged','completed'], default: 'generated' },
  acknowledged_at: { type: Date },
  completed_at:    { type: Date },

  generated_by:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

dispatchManifestSchema.index({ company_id: 1, trip_id: 1 });
dispatchManifestSchema.index({ company_id: 1, manifest_number: 1 });
// manifest_number has unique:true in field def — no extra index needed

module.exports = mongoose.model('DispatchManifest', dispatchManifestSchema);
