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
    console.log('[SEED] Checking database state in persistent storage...');

    // 1. Initialize Game Settings if not already present
    let settings = await GameSettings.findOne();
    if (!settings) {
      settings = await GameSettings.create({
        startingCapital: 10000,
        minimumCash: 2000,
        bankReturnPercent: 5,
        goldReturnPercent: 8,
        currentRound: 1,
        gameStatus: 'LIVE',
        announcement: 'Welcome to CAPITAL RUSH 2026! Round 1 (Investment Strategy) is now active.'
      });
      console.log('[SEED] Initialized GameSettings.');
    } else {
      console.log(`[SEED] Existing GameSettings loaded (Round ${settings.currentRound}, Status: ${settings.gameStatus}).`);
    }

    // 2. Create 10 Administrators if not already present
    const existingAdmins = await User.countDocuments({ role: 'ADMIN' });
    if (existingAdmins === 0) {
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
    } else {
      console.log(`[SEED] Verified ${existingAdmins} administrator accounts in database.`);
    }

    // 3. Log current team and participant counts
    const teamCount = await Team.countDocuments();
    const participantCount = await User.countDocuments({ role: 'PARTICIPANT' });
    console.log(`[SEED] Database verified: ${teamCount} teams, ${participantCount} participants safely loaded from persistent storage.`);
    console.log('[SEED] Seeding check completed successfully!');
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
