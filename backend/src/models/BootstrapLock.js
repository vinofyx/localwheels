const mongoose = require('mongoose');

const bootstrapLockSchema = new mongoose.Schema({
  lock_name: {
    type: String,
    required: true,
    unique: true,
    default: 'superadmin_bootstrap',
  },
  is_completed: {
    type: Boolean,
    default: false,
    index: true,
  },
  completed_at: {
    type: Date,
  },
  completed_by_ip: {
    type: String,
  },
  bootstrap_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  bootstrap_username: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('BootstrapLock', bootstrapLockSchema);

