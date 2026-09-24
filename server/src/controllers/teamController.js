const Team = require('../models/Team');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

/**
 * Get Team details for participant's own team
 */
const getMyTeam = async (req, res) => {
  try {
    if (!req.user.team) {
      return res.status(404).json({ success: false, message: 'No team associated with your account.' });
    }

    const team = await Team.findById(req.user.team._id || req.user.team);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.currentCapital < 1000 && team.status === 'ACTIVE') {
      team.status = 'DISQUALIFIED';
      await team.save();
    }

    let portfolio = await Portfolio.findOne({ team: team._id });
    if (!portfolio) {
      portfolio = await Portfolio.create({
        team: team._id,
        cash: team.currentCapital,
        totalValuation: team.currentCapital
      });
    } else if (portfolio.cash < 0) {
      portfolio.rebalanceNegativeCash();
      await portfolio.save();
    }

    const members = await User.find({ team: team._id, role: 'PARTICIPANT' }).select('name email status');
    const transactions = await Transaction.find({ team: team._id })
      .sort({ createdAt: -1 })
      .limit(30);

    return res.status(200).json({
      success: true,
      team,
      portfolio,
      members,
      transactions
    });
  } catch (error) {
    console.error('Error fetching my team:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch team data.' });
  }
};

/**
 * Get Team details by Team ID (e.g. CR-001) - for Admin or Lookup
 */
const getTeamByTeamId = async (req, res) => {
  try {
    const { teamId } = req.params;
    const cleanId = teamId.trim().toUpperCase();

    const team = await Team.findOne({ teamId: cleanId });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    let portfolio = await Portfolio.findOne({ team: team._id });
    if (!portfolio) {
      portfolio = await Portfolio.create({
        team: team._id,
        cash: team.currentCapital,
        totalValuation: team.currentCapital
      });
    } else if (portfolio.cash < 0) {
      portfolio.rebalanceNegativeCash();
      await portfolio.save();
    }

    const members = await User.find({ team: team._id, role: 'PARTICIPANT' }).select('name email status');
    const transactions = await Transaction.find({ team: team._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      team,
      portfolio,
      members,
      transactions
    });
  } catch (error) {
    console.error('Error fetching team by ID:', error);
    return res.status(500).json({ success: false, message: 'Error fetching team details.' });
  }
};

/**
 * Safe public lookup for Round 3 Transfer confirmation
 * Returns only safe fields: teamId, name, currentCapital
 */
const lookupTeamForTransfer = async (req, res) => {
  try {
    const { teamId } = req.params;
    const cleanId = teamId.trim().toUpperCase();

    const team = await Team.findOne({ teamId: cleanId }).select('teamId name currentCapital status');
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.currentCapital < 1000 || team.status === 'DISQUALIFIED' || team.status === 'ELIMINATED') {
      return res.status(400).json({ success: false, message: `${team.name} has been ELIMINATED (Capital below ₹1,000) and cannot receive transfers.` });
    }

    return res.status(200).json({
      success: true,
      team: {
        teamId: team.teamId,
        name: team.name,
        currentCapital: team.currentCapital,
        status: team.status
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error looking up team.' });
  }
};

module.exports = {
  getMyTeam,
  getTeamByTeamId,
  lookupTeamForTransfer
};
