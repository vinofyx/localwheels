const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      'MONGO_URI is not set in .env — add your MongoDB connection string'
    );
  }

  const options = {
    serverSelectionTimeoutMS: 10000,   // fail fast if Atlas unreachable
    connectTimeoutMS:         10000,
    socketTimeoutMS:          45000,
    maxPoolSize:              10,
  };

  try {
    await mongoose.connect(uri, options);
    console.log('✅ MongoDB connected');
  } catch (err) {
    // Surface a helpful message for the two most common Atlas problems
    if (err.name === 'MongoServerSelectionError' ||
        err.message.includes('ENOTFOUND') ||
        err.message.includes('ETIMEOUT') ||
        err.message.includes('IP that isn\'t whitelisted') ||
        err.message.includes('whitelist')) {
      console.error('\n❌ Cannot reach MongoDB Atlas. Two common causes:');
      console.error(
        '   1. Your IP is not whitelisted → go to Atlas > Network Access > Add IP Address → add 0.0.0.0/0 for dev'
      );
      console.error(
        '   2. Free-tier cluster is paused → go to Atlas > Clusters > Resume\n'
      );
    }
    throw err;
  }
}

module.exports = connectDB;
