const mongoose = require('mongoose');

const fasTagEntrySchema = new mongoose.Schema(
  {
    company_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    entry_no:         { type: String, default: '1' },
    entry_date:       { type: Date, default: Date.now },
    vehicle_no:       { type: String, required: true },
    tag_id:           { type: String, default: '' },
    toll_plaza:       { type: String, required: true },
    transaction_time: { type: Date, default: Date.now },
    amount:           { type: Number, required: true },
    status:           { type: String, enum: ['pending', 'posted'], default: 'posted' },
    route_name:       { type: String, default: '' },
  },
  { timestamps: true }
);

fasTagEntrySchema.index({ company_id: 1, vehicle_no: 1, transaction_time: -1 });

module.exports = mongoose.model('FasTagEntry', fasTagEntrySchema);

