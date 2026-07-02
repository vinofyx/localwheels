const mongoose = require('mongoose');

const tyreSchema = new mongoose.Schema({
  company_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  vehicle_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'FleetVehicle', required: true },
  tyre_serial:        { type: String, required: true },
  position:           { type: String, enum: ['FL','FR','RL','RR','RL2','RR2','Spare'], required: true },
  brand:              String,
  model:               String,
  size:                String,
  installed_at:        { type: Date, default: Date.now },
  installed_odometer_km: Number,
  removed_at:          Date,
  removed_odometer_km: Number,
  removal_reason:      { type: String, enum: ['worn_out','puncture_damage','sidewall_damage','warranty_replace','scheduled_rotation','other'] },
  tread_depth_mm:      { type: Number, default: 8 },
  last_rotation_at:    Date,
  last_rotation_odometer_km: Number,
  rotation_count:      { type: Number, default: 0 },
  warranty_months:     Number,
  warranty_expires_at: Date,
  purchase_cost:       Number,
  vendor_id:           { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  status:              { type: String, enum: ['active','retired','spare'], default: 'active' },
  notes:                String,
}, { timestamps: true });

tyreSchema.index({ company_id: 1, vehicle_id: 1, status: 1 });
tyreSchema.index({ company_id: 1, warranty_expires_at: 1 });

module.exports = mongoose.model('Tyre', tyreSchema);
