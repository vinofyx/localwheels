const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjId = Schema.Types.ObjectId;

const RULE_TYPES = [
  'lead_assignment','quote_generation','shipment_creation','vehicle_allocation',
  'driver_allocation','dispatch_planning','warehouse_putaway','inventory_replenishment',
  'invoice_generation','payment_reminder','complaint_routing','document_classification',
  'maintenance_scheduling','supplier_approval','executive_report','custom',
];

const automationRuleSchema = new Schema({
  company_id:   { type: ObjId, ref: 'Company', required: true, index: true },
  workflow_id:  { type: ObjId, ref: 'AutomationWorkflow' },
  name:         { type: String, required: true },
  rule_type:    { type: String, enum: RULE_TYPES, default: 'custom' },
  description:  String,
  is_active:    { type: Boolean, default: true },
  priority:     { type: Number, default: 5 },
  conditions: [{
    field:     String,
    operator:  { type: String, enum: ['eq','neq','gt','gte','lt','lte','contains','not_contains','in','not_in','exists','not_exists'] },
    value:     Schema.Types.Mixed,
  }],
  condition_logic: { type: String, enum: ['AND','OR'], default: 'AND' },
  actions: [{
    action_type:   String,
    action_config: Schema.Types.Mixed,
    order:         Number,
  }],
  trigger_count: { type: Number, default: 0 },
  created_by:   { type: ObjId, ref: 'User' },
}, { timestamps: true });

automationRuleSchema.index({ company_id: 1, rule_type: 1, is_active: 1 });

module.exports = mongoose.model('AutomationRule', automationRuleSchema);
