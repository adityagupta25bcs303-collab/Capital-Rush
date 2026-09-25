const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            console.error('[DB] MONGODB_URI is not defined');
            process.exit(1);
        }

        const conn = await mongoose.connect(mongoUri);

        console.log(`[DB] Connected to MongoDB: ${conn.connection.host}`);
    } catch (error) {
        console.error('[DB] Error connecting to database:', error);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    try {
        await mongoose.disconnect();
        console.log('[DB] MongoDB disconnected');
    } catch (error) {
        console.error('[DB] Error during disconnection:', error);
    }
};

process.on('SIGINT', async () => {
    await disconnectDB();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await disconnectDB();
    process.exit(0);
});

module.exports = { connectDB, disconnectDB };