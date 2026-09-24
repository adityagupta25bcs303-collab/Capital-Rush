const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

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

    // Permanent on-disk embedded MongoDB with WiredTiger storage engine
    const dbDir = path.resolve(__dirname, '..', '..', 'data', 'db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    console.log(`[DB] Initializing Persistent MongoDB Storage Engine at ${dbDir}...`);
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create({
      instance: {
        dbPath: dbDir,
        storageEngine: 'wiredTiger',
        dbName: 'capital_rush'
      }
    });

    const uri = mongod.getUri('capital_rush');
    const conn = await mongoose.connect(uri, {
      writeConcern: { w: 1, j: true },
      autoIndex: true
    });
    console.log(`[DB] Connected to Persistent MongoDB: ${conn.connection.host} (Database: capital_rush, Journal: on-disk)`);
  } catch (error) {
    console.error(`[DB] Error connecting to database:`, error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await mongoose.connection.db.admin().command({ fsync: 1 });
      } catch (e) {}
    }
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  } catch (err) {
    console.error('[DB] Error during disconnection:', err);
  }
};

// Graceful process exit flushes
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = { connectDB, disconnectDB };
