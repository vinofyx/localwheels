const mongoose = require('mongoose');

const businessContinuitySchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  plan_name:   { type: String, required: true },
  description: { type: String },
  scenario_type: { type: String, enum: ['branch_closure','fleet_breakdown','supplier_failure','cyber_attack','natural_disaster','pandemic','key_person','power_outage','data_loss','system_outage','warehouse_fire','data_breach','key_person_loss','custom'], required: true },
  status:      { type: String, enum: ['draft','approved','active','tested','archived'], default: 'draft' },
  priority:    { type: String, enum: ['critical','high','medium','low'], default: 'high' },
  rto_hours:   { type: Number, default: 24 },
  rpo_hours:   { type: Number, default: 4 },
  affected_systems: [String],
  recovery_steps: [{
    step_no:     Number,
    title:       String,
    description: String,
    owner:       String,
    duration_hrs:Number,
    dependencies:[String],
    status:      { type: String, enum: ['pending','in_progress','completed','blocked'], default: 'pending' },
  }],
  last_tested_at: { type: Date },
  test_result:    { type: String, enum: ['pass','fail','partial'] },
  approved_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at:  { type: Date },
  review_date:  { type: Date },
  created_by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

businessContinuitySchema.index({ company_id: 1, scenario_type: 1, status: 1 });
module.exports = mongoose.model('BusinessContinuity', businessContinuitySchema);
