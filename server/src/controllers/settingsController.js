const GameSettings = require('../models/GameSettings');
const { logAdminAction } = require('../services/auditService');
const { emitRoundUpdate, emitGameStatusUpdate, emitLeaderboardUpdate } = require('../services/socketService');

const getSettings = async (req, res) => {
  try {
    let settings = await GameSettings.findOne();
    if (!settings) {
      settings = await GameSettings.create({
        startingCapital: 10000,
        minimumCash: 2000,
        bankReturnPercent: 5,
        goldReturnPercent: 8,
        currentRound: 1,
        gameStatus: 'NOT_STARTED'
      });
    }

    return res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error retrieving settings.' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const {
      startingCapital,
      minimumCash,
      bankReturnPercent,
      goldReturnPercent,
      stockReturnPercent,
      minimumAssetInvestment,
      maximumTotalInvestable,
      activeRound2Task,
      currentRound,
      gameStatus,
      announcement
    } = req.body;

    let settings = await GameSettings.findOne();
    if (!settings) {
      settings = new GameSettings({});
    }

    const prevRound = settings.currentRound;
    const prevStatus = settings.gameStatus;

    if (startingCapital !== undefined) settings.startingCapital = Number(startingCapital);
    if (minimumCash !== undefined) settings.minimumCash = Number(minimumCash);
    if (bankReturnPercent !== undefined) settings.bankReturnPercent = Number(bankReturnPercent);
    if (goldReturnPercent !== undefined) settings.goldReturnPercent = Number(goldReturnPercent);
    if (stockReturnPercent !== undefined) settings.stockReturnPercent = Number(stockReturnPercent);
    if (minimumAssetInvestment !== undefined) settings.minimumAssetInvestment = Number(minimumAssetInvestment);
    if (maximumTotalInvestable !== undefined) settings.maximumTotalInvestable = Number(maximumTotalInvestable);
    if (activeRound2Task !== undefined) settings.activeRound2Task = activeRound2Task;
    if (currentRound !== undefined) {
      const rNum = Number(currentRound);
      if (![1, 2].includes(rNum)) {
        return res.status(400).json({ success: false, message: 'Invalid round. Competition consists of only Round 1 and Round 2.' });
      }
      settings.currentRound = rNum;
    }
    if (gameStatus !== undefined) settings.gameStatus = gameStatus;
    if (announcement !== undefined) settings.announcement = announcement;

    await settings.save();

    await logAdminAction({
      adminId: req.user.adminId,
      action: 'ROUND_CHANGED',
      details: {
        roundChanged: prevRound !== settings.currentRound,
        prevRound,
        newRound: settings.currentRound,
        statusChanged: prevStatus !== settings.gameStatus,
        prevStatus,
        newStatus: settings.gameStatus,
        bankReturnPercent: settings.bankReturnPercent,
        goldReturnPercent: settings.goldReturnPercent
      },
      ip: req.ip
    });

    if (prevRound !== settings.currentRound) {
      emitRoundUpdate({ currentRound: settings.currentRound });
    }
    if (prevStatus !== settings.gameStatus) {
      emitGameStatusUpdate({ gameStatus: settings.gameStatus });
    }
    emitLeaderboardUpdate({ trigger: 'settings_changed' });

    return res.status(200).json({
      success: true,
      message: 'Game settings updated successfully.',
      settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
