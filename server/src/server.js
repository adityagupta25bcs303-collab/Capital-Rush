require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./services/socketService');
const { seedInitialData } = require('./seed/seedData');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Connect to DB (external URI or embedded fallback)
    await connectDB();

    // 2. Initialize Seed Data if database is empty
    await seedInitialData();

    // 3. Create HTTP & Socket.IO Server
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: 'https://capital-rush-delta.vercel.app',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true
      }
    });

    initSocket(io);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`   CAPITAL RUSH SERVER — IIIT KOTTAYAM                 `);
      console.log(`   Think. Invest. Risk. Negotiate. Win.                `);
      console.log(`   Port: ${PORT} | Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   URL: http://localhost:${PORT}                       `);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Fatal Server Error:', error);
    process.exit(1);
  }
};

startServer();
