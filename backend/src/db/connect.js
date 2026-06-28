const mongoose = require('mongoose');

const IS_PROD = process.env.NODE_ENV === 'production';

async function connectDB() {
  // Support both MONGODB_URI (Render default) and MONGO_URI (legacy)
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      'MongoDB URI not set — add MONGODB_URI to your environment variables'
    );
  }

  const options = {
    // Connection timeouts
    serverSelectionTimeoutMS: IS_PROD ? 15000 : 10000,
    connectTimeoutMS:         IS_PROD ? 15000 : 10000,
    socketTimeoutMS:          45000,

    // Connection pool
    maxPoolSize:  IS_PROD ? 20 : 5,
    minPoolSize:  IS_PROD ? 2  : 1,

    // Write concern — production must acknowledge writes to majority of replicas
    ...(IS_PROD && {
      w:        'majority',
      journal:  true,
      wtimeoutMS: 10000,
    }),
  };

  try {
    await mongoose.connect(uri, options);

    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected — attempting reconnect…');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

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
