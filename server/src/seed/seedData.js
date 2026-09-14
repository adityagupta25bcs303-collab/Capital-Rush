const bcrypt = require('bcryptjs');
const Team = require('../models/Team');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const GameSettings = require('../models/GameSettings');
const AuditLog = require('../models/AuditLog');
const Transfer = require('../models/Transfer');
const { generateTeamQRCode } = require('../utils/qrHelper');
const { generateTransactionId } = require('../utils/idGenerator');

const seedInitialData = async () => {
  try {
    console.log('[SEED] Checking database state...');

    const existingTeams = await Team.countDocuments();
    if (existingTeams > 0) {
      console.log('[SEED] Database already contains data. Skipping initial seeding.');
      return;
    }

    console.log('[SEED] Database empty. Beginning initial seed...');

    // 1. Initialize Game Settings
    await GameSettings.deleteMany({});
    const settings = await GameSettings.create({
      startingCapital: 10000,
      minimumCash: 2000,
      bankReturnPercent: 5,
      goldReturnPercent: 8,
      currentRound: 1,
      gameStatus: 'LIVE',
      announcement: 'Welcome to CAPITAL RUSH 2026! Round 1 (Investment Strategy) is now active.'
    });
    console.log('[SEED] Initialized GameSettings.');

    // 2. Teams initialized to ZERO default (increases dynamically as teams are created or participants register)
    console.log('[SEED] Teams initialized to 0. Ready for dynamic team registrations.');

    // 3. Participants start at ZERO default (increases as participants register or are added by admin)
    console.log('[SEED] Participant users initialized to 0. Ready for live event registrations.');

    // 4. Create 10 Administrators
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const admins = [];
    for (let i = 1; i <= 10; i++) {
      const adminId = `ADMIN${String(i).padStart(2, '0')}`;
      admins.push({
        name: `Admin Officer ${i}`,
        adminId,
        password: adminPasswordHash,
        role: 'ADMIN',
        status: 'ACTIVE'
      });
    }

    await User.insertMany(admins);
    console.log(`[SEED] Created 10 administrator accounts (ADMIN01 to ADMIN10).`);

    console.log('[SEED] Seeding completed successfully!');
  } catch (error) {
    console.error('[SEED] Error during database seeding:', error);
  }
};

// Allow running directly via CLI
if (require.main === module) {
  require('dotenv').config();
  const { connectDB, disconnectDB } = require('../config/db');

  (async () => {
    await connectDB();
    await seedInitialData();
    await disconnectDB();
    process.exit(0);
  })();
}

module.exports = { seedInitialData };
