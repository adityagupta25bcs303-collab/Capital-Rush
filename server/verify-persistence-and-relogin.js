const mongoose = require('mongoose');
const path = require('path');
const { connectDB, disconnectDB } = require('./src/config/db');
const { seedInitialData } = require('./src/seed/seedData');
const User = require('./src/models/User');
const Team = require('./src/models/Team');
const Portfolio = require('./src/models/Portfolio');
const { loginParticipant, registerParticipant } = require('./src/controllers/authController');

async function runTest() {
  console.log('--- Step 1: Connecting to Persistent Database ---');
  await connectDB();
  await seedInitialData();

  console.log('--- Step 2: Creating Test Participant & Team ---');
  const testEmail = 'persist_test@iiitkottayam.ac.in';
  const testPassword = 'Password@123';
  const testTeamName = 'Persistence Warriors';

  // Clean any previous test user/team with this email
  const existingUser = await User.findOne({ email: testEmail });
  if (existingUser) {
    if (existingUser.team) {
      await Portfolio.deleteMany({ team: existingUser.team });
      await Team.deleteOne({ _id: existingUser.team });
    }
    await User.deleteOne({ _id: existingUser._id });
  }

  // Mock req and res for registerParticipant
  let registeredData = null;
  const regReq = {
    body: {
      name: 'Test Player',
      email: testEmail,
      password: testPassword,
      teamName: testTeamName
    }
  };
  const regRes = {
    status: (code) => ({
      json: (data) => {
        registeredData = { code, ...data };
        return registeredData;
      }
    })
  };

  await registerParticipant(regReq, regRes);
  if (!registeredData || !registeredData.success) {
    throw new Error('Registration failed: ' + JSON.stringify(registeredData));
  }
  console.log('Registered Team successfully:', registeredData.user.team.name, registeredData.user.team.teamId);

  // Update portfolio to non-default values (Bank: 2500, Stocks: 3000, Gold: 2000, Cash: 2500)
  const teamId = registeredData.user.team.id;
  const portfolio = await Portfolio.findOne({ team: teamId });
  portfolio.bank = 2500;
  portfolio.stocks = 3000;
  portfolio.gold = 2000;
  portfolio.cash = 2500;
  await portfolio.save();
  console.log('Updated portfolio on disk: Bank 2500, Stocks 3000, Gold 2000, Cash 2500');

  console.log('--- Step 3: Simulating Server Shutdown & Process Exit ---');
  await disconnectDB();
  console.log('Disconnected. Server fully stopped.');

  console.log('--- Step 4: Simulating Server Boot & Database Reconnect ---');
  await connectDB();
  await seedInitialData();

  console.log('--- Step 5: Testing Participant Re-Login with exact credentials ---');
  let loginData = null;
  const loginReq = {
    body: {
      email: testEmail,
      password: testPassword
    }
  };
  const loginRes = {
    status: (code) => ({
      json: (data) => {
        loginData = { code, ...data };
        return loginData;
      }
    })
  };

  await loginParticipant(loginReq, loginRes);
  if (!loginData || !loginData.success) {
    throw new Error('Login failed: ' + JSON.stringify(loginData));
  }

  console.log('Re-login successful! Verifying returned user & portfolio payload:');
  console.log('User Name:', loginData.user.name);
  console.log('Team ID:', loginData.user.team.teamId);
  console.log('Current Capital:', loginData.user.team.currentCapital);
  console.log('Portfolio Breakdown:', loginData.user.portfolio);

  if (!loginData.user.portfolio) {
    throw new Error('Portfolio missing from login response!');
  }
  if (loginData.user.portfolio.bank !== 2500) {
    throw new Error(`Bank mismatch! Expected 2500, got ${loginData.user.portfolio.bank}`);
  }
  if (loginData.user.portfolio.stocks !== 3000) {
    throw new Error(`Stocks mismatch! Expected 3000, got ${loginData.user.portfolio.stocks}`);
  }
  if (loginData.user.portfolio.gold !== 2000) {
    throw new Error(`Gold mismatch! Expected 2000, got ${loginData.user.portfolio.gold}`);
  }
  if (loginData.user.portfolio.cash !== 2500) {
    throw new Error(`Cash mismatch! Expected 2500, got ${loginData.user.portfolio.cash}`);
  }

  console.log('--- ALL CHECKS PASSED: PERMANENT DISK PERSISTENCE & RE-LOGIN RESTORATION VERIFIED! ---');
  await disconnectDB();
}

runTest().catch((err) => {
  console.error('VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
