const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjId = Schema.Types.ObjectId;

const TRIGGER_TYPES = ['schedule','event','manual','webhook','condition','api'];
const CATEGORIES    = ['logistics','fleet','warehouse','crm','finance','hr','compliance','custom'];

const automationWorkflowSchema = new Schema({
  company_id:  { type: ObjId, ref: 'Company', required: true, index: true },
  name:        { type: String, required: true },
  description: String,
  category:    { type: String, enum: CATEGORIES, default: 'custom' },
  trigger_type:{ type: String, enum: TRIGGER_TYPES, default: 'manual' },
  trigger_config: { type: Schema.Types.Mixed, default: {} },
  steps: [{
    step_number: Number,
    name:        String,
    action_type: String,
    action_config: Schema.Types.Mixed,
    condition:   Schema.Types.Mixed,
    on_success:  String,
    on_failure:  String,
  }],
  is_active:   { type: Boolean, default: true },
  is_template: { type: Boolean, default: false },
  run_count:   { type: Number, default: 0 },
  success_count:{ type: Number, default: 0 },
  failure_count:{ type: Number, default: 0 },
  last_run_at: Date,
  next_run_at: Date,
  created_by:  { type: ObjId, ref: 'User' },
  tags:        [String],
}, { timestamps: true });

automationWorkflowSchema.index({ company_id: 1, is_active: 1 });
automationWorkflowSchema.index({ company_id: 1, category: 1 });

module.exports = mongoose.model('AutomationWorkflow', automationWorkflowSchema);
