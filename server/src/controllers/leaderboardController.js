const Team = require('../models/Team');
const GameSettings = require('../models/GameSettings');

/**
 * Public and Live Leaderboard
 * Strict Privacy: Exposes ONLY team name, teamId, capital, profitLoss, return %
 */
const getLeaderboard = async (req, res) => {
  try {
    const settings = await GameSettings.findOne() || { gameStatus: 'NOT_STARTED', currentRound: 1 };

    const teams = await Team.find()
      .select('name teamId currentCapital startingCapital status')
      .sort({ currentCapital: -1 });

    // Separate active teams and eliminated teams (< 1000 capital or disqualified)
    const activeTeams = [];
    const eliminatedTeams = [];

    teams.forEach((t) => {
      const isEliminated = t.currentCapital < 1000 || t.status === 'DISQUALIFIED' || t.status === 'ELIMINATED';
      if (isEliminated) {
        eliminatedTeams.push({ team: t, isEliminated: true });
      } else {
        activeTeams.push({ team: t, isEliminated: false });
      }
    });

    // Active teams sorted by capital desc, followed by eliminated teams sorted by capital desc
    const combined = [...activeTeams, ...eliminatedTeams];

    const rankings = combined.map(({ team, isEliminated }, index) => {
      const profitLoss = team.currentCapital - team.startingCapital;
      const returnPct = team.startingCapital === 0
        ? 0
        : Number((((team.currentCapital - team.startingCapital) / team.startingCapital) * 100).toFixed(2));

      return {
        rank: index + 1,
        teamId: team.teamId,
        name: team.name,
        currentCapital: team.currentCapital,
        startingCapital: team.startingCapital,
        profitLoss,
        returnPercentage: returnPct,
        status: isEliminated ? 'ELIMINATED' : team.status,
        isEliminated
      };
    });

    const activeRankings = rankings.filter((r) => !r.isEliminated);
    const winner = activeRankings.length > 0 ? activeRankings[0] : (rankings.length > 0 ? rankings[0] : null);

    return res.status(200).json({
      success: true,
      gameStatus: settings.gameStatus,
      currentRound: settings.currentRound,
      announcement: settings.announcement,
      leaderboard: rankings,
      winner: settings.gameStatus === 'FINISHED' ? winner : null
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve leaderboard.' });
  }
};

module.exports = { getLeaderboard };
