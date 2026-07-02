const mongoose = require('mongoose');

const driverNotificationSchema = new mongoose.Schema({
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  driver_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  trip_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },

  type: {
    type: String,
    enum: ['trip_assigned', 'trip_started', 'delay_alert', 'route_change', 'emergency',
           'breakdown', 'pod_uploaded', 'trip_completed', 'document_expiry', 'general'],
    required: true,
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  data:    { type: mongoose.Schema.Types.Mixed },

  is_read:   { type: Boolean, default: false },
  read_at:   { type: Date },
  priority:  { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
}, { timestamps: true });

driverNotificationSchema.index({ company_id: 1, driver_id: 1, is_read: 1 });
driverNotificationSchema.index({ driver_id: 1, createdAt: -1 });

module.exports = mongoose.model('DriverNotification', driverNotificationSchema);
