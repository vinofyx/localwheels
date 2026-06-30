const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId  = Schema.Types.ObjectId;

const alternativeSchema = new Schema({
  vehicle_type:    String,
  vehicle_capacity: String,
  base_freight:    Number,
  grand_total:     Number,
  transit_days:    String,
}, { _id: false });

const quoteSchema = new Schema({
  quote_number:  { type: String, unique: true },
  company_id:    { type: ObjectId, ref: 'Company' },

  status: {
    type: String,
    enum: ['active', 'accepted', 'rejected', 'expired', 'converted'],
    default: 'active',
  },
  valid_until: Date,

  customer_name:  { type: String, required: true },
  customer_phone: { type: String, required: true },
  customer_email: String,
  customer_gstin: String,

  pickup_address:      String,
  pickup_pincode:      String,
  pickup_city:         String,
  pickup_state:        String,
  destination_address: String,
  destination_pincode: String,
  destination_city:    String,
  destination_state:   String,
  estimated_distance_km: { type: Number, default: 0 },
  distance_source:       { type: String, enum: ['user', 'estimated', 'google_maps'], default: 'estimated' },

  material_type:        String,
  commodity:            String,
  weight_kg:            Number,
  length_cm:            Number,
  width_cm:             Number,
  height_cm:            Number,
  volumetric_weight_kg: { type: Number, default: 0 },
  chargeable_weight_kg: Number,
  packages:             { type: Number, default: 1 },
  declared_value:       { type: Number, default: 0 },

  pickup_date:       Date,
  pickup_time:       String,
  delivery_priority: { type: String, enum: ['standard', 'express', 'premium'], default: 'standard' },

  insurance_required: { type: Boolean, default: false },
  loading_required:   { type: Boolean, default: false },
  unloading_required: { type: Boolean, default: false },

  vehicle_type:           String,
  vehicle_capacity_label: String,
  transit_days:           String,

  base_freight:      { type: Number, default: 0 },
  distance_charges:  { type: Number, default: 0 },
  fuel_surcharge:    { type: Number, default: 0 },
  toll_charges:      { type: Number, default: 0 },
  state_tax:         { type: Number, default: 0 },
  express_charges:   { type: Number, default: 0 },
  subtotal:          { type: Number, default: 0 },
  gst_rate:          { type: Number, default: 18 },
  gst_amount:        { type: Number, default: 0 },
  insurance_amount:  { type: Number, default: 0 },
  loading_charges:   { type: Number, default: 0 },
  unloading_charges: { type: Number, default: 0 },
  grand_total:       { type: Number, default: 0 },

  ai_vehicle_recommendation: String,
  ai_risk_assessment:        String,
  ai_insurance_note:         String,
  ai_handling_note:          String,
  ai_upsell_suggestions:     [Schema.Types.Mixed],
  ai_cost_tip:               String,

  customer_discount_amount:  { type: Number, default: 0 },
  customer_discount_label:   String,

  alternatives: [alternativeSchema],

  converted_to_shipment_id: { type: ObjectId, ref: 'Shipment' },
  created_by:               { type: ObjectId, ref: 'User' },
}, { timestamps: true });

quoteSchema.index({ company_id: 1, createdAt: -1 });
quoteSchema.index({ customer_phone: 1 });
quoteSchema.index({ status: 1, valid_until: 1 });

module.exports = mongoose.model('Quote', quoteSchema);
