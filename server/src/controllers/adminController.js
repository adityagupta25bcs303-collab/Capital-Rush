const Team = require('../models/Team');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const Transfer = require('../models/Transfer');
const AuditLog = require('../models/AuditLog');
const GameSettings = require('../models/GameSettings');
const bcrypt = require('bcryptjs');
const { generateTeamQRCode } = require('../utils/qrHelper');
const { formatTeamId, generateTransactionId } = require('../utils/idGenerator');
const { logAdminAction } = require('../services/auditService');
const { emitLeaderboardUpdate } = require('../services/socketService');

/**
 * Get aggregated statistics for the Admin Dashboard
 */
const getDashboardStats = async (req, res) => {
  try {
    const totalTeams = await Team.countDocuments({ status: 'ACTIVE' });
    const totalPlayers = await User.countDocuments({ role: 'PARTICIPANT', status: 'ACTIVE' });
    const settings = await GameSettings.findOne() || { currentRound: 1, gameStatus: 'NOT_STARTED' };

    const teams = await Team.find({ status: 'ACTIVE' }).select('name teamId currentCapital');

    let totalCapital = 0;
    let highestCapital = 0;
    let lowestCapital = Infinity;
    let leader = null;

    if (teams.length > 0) {
      teams.forEach(t => {
        totalCapital += t.currentCapital;
        if (t.currentCapital > highestCapital) {
          highestCapital = t.currentCapital;
          leader = t;
        }
        if (t.currentCapital < lowestCapital) {
          lowestCapital = t.currentCapital;
        }
      });
    } else {
      lowestCapital = 0;
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalTeams,
        totalPlayers,
        totalCapital,
        currentRound: settings.currentRound,
        gameStatus: settings.gameStatus,
        highestCapital: highestCapital || 0,
        lowestCapital: lowestCapital === Infinity ? 0 : lowestCapital,
        leader: leader ? { name: leader.name, teamId: leader.teamId, capital: leader.currentCapital } : null
      }
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
};

/**
 * Get all teams with participant counts and portfolio summary
 */
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find().sort({ currentCapital: -1 });

    const teamsWithDetails = await Promise.all(
      teams.map(async (team) => {
        const memberCount = await User.countDocuments({ team: team._id, role: 'PARTICIPANT' });
        const portfolio = await Portfolio.findOne({ team: team._id }).select('cash bank stocks gold stockReturnPercent totalValuation');
        return {
          id: team._id,
          teamId: team.teamId,
          name: team.name,
          startingCapital: team.startingCapital,
          currentCapital: team.currentCapital,
          profitLoss: team.profitLoss,
          returnPercentage: team.returnPercentage,
          status: team.status,
          isEliminated: team.currentCapital < 1000 || team.status === 'DISQUALIFIED' || team.status === 'ELIMINATED',
          memberCount,
          portfolio,
          qrCode: team.qrCode
        };
      })
    );

    return res.status(200).json({
      success: true,
      teams: teamsWithDetails
    });
  } catch (error) {
    console.error('Error fetching all teams:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve teams.' });
  }
};

/**
 * Admin creates a new team
 * Enforces UNIQUE Team Name constraint!
 */
const createTeam = async (req, res) => {
  try {
    const { name, startingCapital } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Team name is required.' });
    }

    const trimmedName = name.trim();

    // Check unique team name
    const existing = await Team.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Team name already exists. Please choose another name.'
      });
    }

    const settings = await GameSettings.findOne();
    const capital = startingCapital !== undefined ? Number(startingCapital) : (settings ? settings.startingCapital : 10000);

    // Generate unique Team ID (e.g. CR-001)
    const count = await Team.countDocuments();
    const teamId = formatTeamId(count + 1);

    const qrCode = await generateTeamQRCode(teamId);

    const team = await Team.create({
      teamId,
      name: trimmedName,
      startingCapital: capital,
      currentCapital: capital,
      qrCode
    });

    // Create default Portfolio
    await Portfolio.create({
      team: team._id,
      cash: capital,
      bank: 0,
      stocks: 0,
      gold: 0,
      totalValuation: capital
    });

    // Initial Transaction record
    await Transaction.create({
      transactionId: generateTransactionId(),
      team: team._id,
      type: 'INITIAL_CAPITAL',
      amount: capital,
      previousBalance: 0,
      newBalance: capital,
      reason: 'Initial Starting Capital Allocation',
      round: 1,
      performedBy: req.user.adminId
    });

    await logAdminAction({
      adminId: req.user.adminId,
      action: 'TEAM_CREATED',
      targetTeam: team.teamId,
      details: { name: team.name, startingCapital: capital },
      ip: req.ip
    });

    emitLeaderboardUpdate({ trigger: 'team_created' });

    return res.status(201).json({
      success: true,
      message: `Team ${team.name} (${team.teamId}) created successfully!`,
      team
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Team name already exists. Please choose another name.' });
    }
    console.error('Error creating team:', error);
    return res.status(500).json({ success: false, message: 'Failed to create team.' });
  }
};

/**
 * Admin creates participant and assigns to a team
 * Enforces UNIQUE College Email constraint!
 */
const createParticipant = async (req, res) => {
  try {
    const { name, email, password, teamId } = req.body;

    if (!name || !email || !password || !teamId) {
      return res.status(400).json({ success: false, message: 'Name, College Email, Password, and Team are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check unique college email
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A participant with this college email already exists.' });
    }

    const team = await Team.findOne({ teamId: teamId.trim().toUpperCase() });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Selected team does not exist.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'PARTICIPANT',
      team: team._id,
      status: 'ACTIVE'
    });

    await logAdminAction({
      adminId: req.user.adminId,
      action: 'USER_CREATED',
      targetTeam: team.teamId,
      targetUser: user.email,
      details: { name: user.name, email: user.email, team: team.name },
      ip: req.ip
    });

    return res.status(201).json({
      success: true,
      message: `Participant ${user.name} added to ${team.name}.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        team: { teamId: team.teamId, name: team.name }
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'College email already exists.' });
    }
    console.error('Error creating participant:', error);
    return res.status(500).json({ success: false, message: 'Server error creating participant.' });
  }
};

/**
 * Get all participants
 */
const getAllParticipants = async (req, res) => {
  try {
    const participants = await User.find({ role: 'PARTICIPANT' })
      .populate('team', 'name teamId currentCapital status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      participants
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching participants.' });
  }
};

/**
 * Reset participant password
 */
const resetParticipantPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'Valid user ID and new password (min 4 characters) required.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await logAdminAction({
      adminId: req.user.adminId,
      action: 'PASSWORD_RESET',
      targetUser: user.email || user.adminId,
      details: { userId: user._id },
      ip: req.ip
    });

    return res.status(200).json({
      success: true,
      message: `Password reset successfully for ${user.email || user.name}.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

/**
 * Toggle participant active/disabled status
 */
const toggleParticipantStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.status = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    await user.save();

    await logAdminAction({
      adminId: req.user.adminId,
      action: 'USER_STATUS_UPDATED',
      targetUser: user.email,
      details: { status: user.status },
      ip: req.ip
    });

    return res.status(200).json({
      success: true,
      message: `User status changed to ${user.status}.`,
      status: user.status
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating user status.' });
  }
};

/**
 * Get Admin Audit Logs
 */
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      logs
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching audit logs.' });
  }
};

/**
 * Get all transactions across the platform
 */
const getAllTransactions = async (req, res) => {
  try {
    const { teamId, round } = req.query;
    let query = {};

    if (teamId) {
      const team = await Team.findOne({ teamId: teamId.trim().toUpperCase() });
      if (team) {
        query.team = team._id;
      }
    }

    if (round) {
      query.round = Number(round);
    }

    const transactions = await Transaction.find(query)
      .populate('team', 'name teamId')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      transactions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching transactions.' });
  }
};

/**
 * Delete a participant user
 */
const deleteParticipant = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('team');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Participant not found.' });
    }

    if (user.role === 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot delete administrator accounts via this action.' });
    }

    const deletedUserName = user.name;
    const deletedUserEmail = user.email;
    const teamName = user.team ? user.team.name : 'No Team';
    const teamId = user.team ? user.team.teamId : null;

    await User.findByIdAndDelete(userId);

    await logAdminAction({
      adminId: req.user.adminId,
      action: 'USER_DELETED',
      targetTeam: teamId,
      targetUser: deletedUserEmail,
      details: { name: deletedUserName, email: deletedUserEmail, team: teamName },
      ip: req.ip
    });

    return res.status(200).json({
      success: true,
      message: `Participant ${deletedUserName} (${deletedUserEmail}) deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting participant:', error);
    return res.status(500).json({ success: false, message: 'Error deleting participant.' });
  }
};

/**
 * Reset Participants & Game State to Clean Slate (0 participants)
 */
const resetToCleanSlate = async (req, res) => {
  try {
    const { keepTeams } = req.body || {};

    // Delete all participants
    await User.deleteMany({ role: 'PARTICIPANT' });
    
    // Clear transactions and transfers
    await Transaction.deleteMany({});
    await Transfer.deleteMany({});
    
    if (keepTeams) {
      const teams = await Team.find();
      for (const team of teams) {
        team.currentCapital = team.startingCapital;
        team.status = 'ACTIVE';
        await team.save();
        await Portfolio.findOneAndUpdate(
          { team: team._id },
          {
            cash: team.startingCapital,
            bank: 0,
            stocks: 0,
            gold: 0,
            stockReturnPercent: 0,
            totalValuation: team.startingCapital
          }
        );
      }
    } else {
      // Clean slate resets teams to 0 as well
      await Team.deleteMany({});
      await Portfolio.deleteMany({});
    }

    await logAdminAction({
      adminId: req.user.adminId,
      action: 'SYSTEM_RESET',
      details: { message: 'Reset participants and teams to zero clean state' },
      ip: req.ip
    });

    emitLeaderboardUpdate({ trigger: 'system_reset' });

    return res.status(200).json({
      success: true,
      message: 'System reset to clean slate! Teams and participants count are now 0.'
    });
  } catch (error) {
    console.error('Clean slate error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset state.' });
  }
};

/**
 * Delete a specific team
 */
const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    let team = null;
    if (teamId.match(/^[0-9a-fA-F]{24}$/)) {
      team = await Team.findById(teamId);
    }
    if (!team) {
      team = await Team.findOne({ teamId: teamId.trim().toUpperCase() });
    }

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const teamName = team.name;
    const cleanTeamId = team.teamId;

    await User.deleteMany({ team: team._id, role: 'PARTICIPANT' });
    await Portfolio.deleteMany({ team: team._id });
    await Transaction.deleteMany({ team: team._id });
    await Team.findByIdAndDelete(team._id);

    await logAdminAction({
      adminId: req.user.adminId,
      action: 'TEAM_DELETED',
      targetTeam: cleanTeamId,
      details: { name: teamName, teamId: cleanTeamId },
      ip: req.ip
    });

    emitLeaderboardUpdate({ trigger: 'team_deleted' });

    return res.status(200).json({
      success: true,
      message: `Team ${teamName} (${cleanTeamId}) deleted successfully.`
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete team.' });
  }
};

module.exports = {
  getDashboardStats,
  getAllTeams,
  createTeam,
  deleteTeam,
  createParticipant,
  getAllParticipants,
  resetParticipantPassword,
  toggleParticipantStatus,
  deleteParticipant,
  resetToCleanSlate,
  getAuditLogs,
  getAllTransactions
};


