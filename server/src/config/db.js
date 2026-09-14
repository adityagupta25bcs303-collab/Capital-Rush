const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri && mongoUri.trim() !== '') {
      console.log(`[DB] Attempting connection to configured MongoDB URI...`);
      try {
        const conn = await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 4000
        });
        console.log(`[DB] Connected to External MongoDB: ${conn.connection.host}`);
        return;
      } catch (err) {
        console.warn(`[DB] Could not connect to external MongoDB: ${err.message}. Falling back to embedded MongoDB engine...`);
      }
    }

    // Fallback: embedded MongoMemoryServer
    console.log('[DB] Initializing Embedded MongoDB Server for zero-setup execution...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    const conn = await mongoose.connect(uri);
    console.log(`[DB] Connected to Embedded MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] Error connecting to database:`, error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  } catch (err) {
    console.error('[DB] Error during disconnection:', err);
  }
};

module.exports = { connectDB, disconnectDB };
