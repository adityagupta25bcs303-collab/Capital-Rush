const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Team = require('../models/Team');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const GameSettings = require('../models/GameSettings');
const { generateTeamQRCode } = require('../utils/qrHelper');
const { formatTeamId, generateTransactionId } = require('../utils/idGenerator');
const { logAdminAction } = require('../services/auditService');

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'capital_rush_super_secret_jwt_key_2026_iiitkottayam';
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      adminId: user.adminId
    },
    secret,
    { expiresIn: '30d' }
  );
};

/**
 * Participant Login: College Email + Password
 */
const loginParticipant = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both college email and password.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail, role: 'PARTICIPANT' }).populate('team');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid login credentials.' });
    }

    if (user.status === 'DISABLED') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated by the administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid login credentials.' });
    }

    if (!user.team) {
      return res.status(400).json({ success: false, message: 'No team assigned to this account. Please contact an administrator.' });
    }

    // Fetch latest portfolio for this team
    let portfolio = await Portfolio.findOne({ team: user.team._id });
    if (!portfolio) {
      portfolio = await Portfolio.create({
        team: user.team._id,
        cash: user.team.currentCapital,
        totalValuation: user.team.currentCapital
      });
    } else if (portfolio.cash < 0) {
      portfolio.rebalanceNegativeCash();
      await portfolio.save();
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Participant login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: {
          id: user.team._id,
          teamId: user.team.teamId,
          name: user.team.name,
          currentCapital: user.team.currentCapital,
          startingCapital: user.team.startingCapital,
          status: user.team.status
        },
        portfolio: {
          cash: portfolio.cash,
          bank: portfolio.bank,
          stocks: portfolio.stocks,
          gold: portfolio.gold,
          stockReturnPercent: portfolio.stockReturnPercent,
          totalValuation: portfolio.totalValuation
        }
      }
    });
  } catch (error) {
    console.error('Login Participant Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login. Please try again.' });
  }
};

/**
 * Admin Login: Admin ID + Password
 */
const loginAdmin = async (req, res) => {
  try {
    const { adminId, password } = req.body;

    if (!adminId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both Admin ID and password.' });
    }

    const cleanAdminId = adminId.trim().toUpperCase();
    const admin = await User.findOne({ adminId: cleanAdminId, role: 'ADMIN' });

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid Admin credentials.' });
    }

    if (admin.status === 'DISABLED') {
      return res.status(403).json({ success: false, message: 'Admin account is currently disabled.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Admin credentials.' });
    }

    const token = generateToken(admin);

    await logAdminAction({
      adminId: admin.adminId,
      action: 'ADMIN_LOGIN',
      details: { name: admin.name },
      ip: req.ip
    });

    return res.status(200).json({
      success: true,
      message: 'Admin login successful.',
      token,
      admin: {
        id: admin._id,
        adminId: admin.adminId,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login Admin Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during admin login.' });
  }
};

/**
 * Get current session user
 */
const getMe = async (req, res) => {
  try {
    const user = req.user;
    let portfolio = null;
    if (user.team) {
      const teamId = user.team._id || user.team;
      portfolio = await Portfolio.findOne({ team: teamId });
      if (portfolio && portfolio.cash < 0) {
        portfolio.rebalanceNegativeCash();
        await portfolio.save();
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        adminId: user.adminId,
        role: user.role,
        team: user.team,
        portfolio: portfolio ? {
          cash: portfolio.cash,
          bank: portfolio.bank,
          stocks: portfolio.stocks,
          gold: portfolio.gold,
          stockReturnPercent: portfolio.stockReturnPercent,
          totalValuation: portfolio.totalValuation
        } : null
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving profile.' });
  }
};

/**
 * Participant Self-Registration
 */
const registerParticipant = async (req, res) => {
  try {
    const { name, email, password, teamId, teamName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, college email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this college email already exists. Please log in.' });
    }

    let teamDoc = null;

    if (teamId && teamId.trim()) {
      teamDoc = await Team.findOne({ teamId: teamId.trim().toUpperCase(), status: 'ACTIVE' });
      if (!teamDoc) {
        return res.status(404).json({ success: false, message: 'Specified Team ID not found.' });
      }
    } else if (teamName && teamName.trim()) {
      const cleanTeamName = teamName.trim();
      teamDoc = await Team.findOne({ name: { $regex: new RegExp(`^${cleanTeamName}$`, 'i') } });

      if (!teamDoc) {
        const settings = await GameSettings.findOne();
        const capital = settings?.startingCapital || 10000;
        const count = await Team.countDocuments();
        const newTeamId = formatTeamId(count + 1);
        const qrCode = await generateTeamQRCode(newTeamId);

        teamDoc = await Team.create({
          teamId: newTeamId,
          name: cleanTeamName,
          startingCapital: capital,
          currentCapital: capital,
          qrCode
        });

        await Portfolio.create({
          team: teamDoc._id,
          cash: capital,
          totalValuation: capital
        });

        await Transaction.create({
          transactionId: generateTransactionId(),
          team: teamDoc._id,
          type: 'INITIAL_CAPITAL',
          amount: capital,
          previousBalance: 0,
          newBalance: capital,
          reason: 'Initial Starting Capital Allocation',
          round: 1,
          performedBy: cleanEmail
        });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Please select an existing team or provide a team name.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'PARTICIPANT',
      team: teamDoc._id,
      status: 'ACTIVE'
    });

    const portfolio = await Portfolio.findOne({ team: teamDoc._id });
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: `Registration successful! Welcome to ${teamDoc.name}.`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: {
          id: teamDoc._id,
          teamId: teamDoc.teamId,
          name: teamDoc.name,
          currentCapital: teamDoc.currentCapital,
          startingCapital: teamDoc.startingCapital,
          status: teamDoc.status
        },
        portfolio: portfolio ? {
          cash: portfolio.cash,
          bank: portfolio.bank,
          stocks: portfolio.stocks,
          gold: portfolio.gold,
          stockReturnPercent: portfolio.stockReturnPercent,
          totalValuation: portfolio.totalValuation
        } : null
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

module.exports = {
  loginParticipant,
  loginAdmin,
  getMe,
  registerParticipant
};
