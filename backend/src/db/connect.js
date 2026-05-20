const mongoose = require('mongoose');

async function connectDB() {
  // Support both MONGODB_URI (Render default) and MONGO_URI (legacy)
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      'MongoDB URI not set — add MONGODB_URI to your environment variables'
    );
  }

  const options = {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS:         10000,
    socketTimeoutMS:          45000,
    maxPoolSize:              10,
  };

  try {
    await mongoose.connect(uri, options);
    console.log('✅ MongoDB connected');
  } catch (err) {
    if (
      err.name === 'MongoServerSelectionError' ||
      err.message.includes('ENOTFOUND')        ||
      err.message.includes('ETIMEOUT')         ||
      err.message.includes('whitelist')
    ) {
      console.error('\n❌ Cannot reach MongoDB Atlas. Common causes:');
      console.error('   1. IP not whitelisted → Atlas > Network Access → Allow 0.0.0.0/0');
      console.error('   2. Free-tier cluster paused → Atlas > Clusters > Resume\n');
    }
    throw err;
  }
}

module.exports = connectDB;
