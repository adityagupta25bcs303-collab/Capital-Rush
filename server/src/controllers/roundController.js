const Team = require('../models/Team');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const GameSettings = require('../models/GameSettings');
const { Round2Task, ROUND2_TASK_DEFINITIONS } = require('../models/Round2Task');
const { logAdminAction } = require('../services/auditService');
const { generateTransactionId } = require('../utils/idGenerator');
const {
  emitToTeam,
  emitLeaderboardUpdate
} = require('../services/socketService');

/**
 * Helper to fetch game settings
 */
const getActiveSettings = async () => {
  let settings = await GameSettings.findOne();
  if (!settings) {
    settings = await GameSettings.create({});
  }
  return settings;
};

// ==========================================
// ROUND 1: INVESTMENT
// ==========================================

/**
 * Participant allocates money across Bank, Stocks, and Gold
 * Rules:
 * - Minimum ₹1,000 in EACH of the three
 * - Maximum ₹8,000 total invested across all three
 * - Remainder is retained in liquid Cash (minimum ₹2,000)
 */
const allocateRound1Portfolio = async (req, res) => {
  try {
    const team = await Team.findById(req.user.team._id || req.user.team);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    if (team.currentCapital < 1000 || team.status === 'DISQUALIFIED' || team.status === 'ELIMINATED') {
      return res.status(403).json({
        success: false,
        message: 'Your team has been ELIMINATED (Capital below ₹1,000) and cannot continue tournament operations.'
      });
    }

    const settings = await getActiveSettings();

    if (settings.gameStatus === 'FINISHED') {
      return res.status(400).json({ success: false, message: 'Game has concluded. Investment allocations are closed.' });
    }

    if (settings.currentRound !== 1 && settings.gameStatus !== 'NOT_STARTED') {
      return res.status(400).json({ success: false, message: 'Investment allocation is only permitted during Round 1.' });
    }

    const { bank, stocks, gold } = req.body;
    const numBank = Math.floor(Number(bank) || 0);
    const numStocks = Math.floor(Number(stocks) || 0);
    const numGold = Math.floor(Number(gold) || 0);

    if (numBank < 0 || numStocks < 0 || numGold < 0) {
      return res.status(400).json({ success: false, message: 'Investment amounts must be non-negative numbers.' });
    }

    // Rule: Minimum ₹1,000 must be placed in EACH of Bank, Stocks, and Gold
    const minPerAsset = settings.minimumAssetInvestment || 1000;
    if (numBank < minPerAsset || numStocks < minPerAsset || numGold < minPerAsset) {
      return res.status(400).json({
        success: false,
        message: `Official Rule: You must put at least ₹${minPerAsset.toLocaleString('en-IN')} in EACH of the 3 options (Bank, Stocks, Gold).`
      });
    }

    // Rule: Maximum ₹8,000 total investable across all three
    const maxInvestable = settings.maximumTotalInvestable || 8000;
    const totalInvested = numBank + numStocks + numGold;
    if (totalInvested > maxInvestable) {
      return res.status(400).json({
        success: false,
        message: `Official Rule: Maximum total investment across Bank, Stocks, and Gold cannot exceed ₹${maxInvestable.toLocaleString('en-IN')} (You allocated ₹${totalInvested.toLocaleString('en-IN')}).`
      });
    }

    const baselineCapital = team.startingCapital || 10000;
    if (totalInvested > baselineCapital) {
      return res.status(400).json({
        success: false,
        message: `Total investment (₹${totalInvested.toLocaleString('en-IN')}) cannot exceed your available capital (₹${baselineCapital.toLocaleString('en-IN')}).`
      });
    }

    // Liquid cash is automatically the remainder
    const numCash = baselineCapital - totalInvested;

    let portfolio = await Portfolio.findOne({ team: team._id });
    if (!portfolio) {
      portfolio = new Portfolio({ team: team._id });
    }

    portfolio.cash = numCash;
    portfolio.bank = numBank;
    portfolio.stocks = numStocks;
    portfolio.gold = numGold;
    portfolio.bankReturnPercent = settings.bankReturnPercent ?? 5;
    portfolio.goldReturnPercent = settings.goldReturnPercent ?? 8;
    portfolio.stockReturnPercent = settings.stockReturnPercent ?? 0;
    portfolio.lastAllocatedAt = new Date();

    const evaluatedValuation = portfolio.calculateValuation();
    await portfolio.save();

    const previousBalance = team.currentCapital;
    team.currentCapital = evaluatedValuation;
    await team.save();

    // Create transaction record
    const txn = await Transaction.create({
      transactionId: generateTransactionId(),
      team: team._id,
      type: 'ROUND1_INVESTMENT',
      amount: evaluatedValuation - previousBalance,
      previousBalance,
      newBalance: evaluatedValuation,
      reason: `Round 1 Portfolio Allocation (Bank: ₹${numBank}, Stocks: ₹${numStocks}, Gold: ₹${numGold}, Retained Cash: ₹${numCash})`,
      round: 1,
      performedBy: req.user.email,
      metadata: { cash: numCash, bank: numBank, stocks: numStocks, gold: numGold }
    });

    // Real-time broadcast
    emitToTeam(team.teamId, 'balance_updated', {
      teamId: team.teamId,
      currentCapital: team.currentCapital,
      portfolio,
      latestTransaction: txn
    });
    emitLeaderboardUpdate({ trigger: 'investment_allocation' });

    return res.status(200).json({
      success: true,
      message: 'Portfolio allocated successfully!',
      portfolio,
      currentCapital: team.currentCapital
    });
  } catch (error) {
    console.error('Error allocating portfolio:', error);
    return res.status(500).json({ success: false, message: 'Server error during investment allocation.' });
  }
};

/**
 * Admin applies stock, gold, or bank outcome percentage or multiplier
 * Supports input in multiplier form (e.g. 1.02) or percentage form (e.g. +2%)
 * Can apply per-team or globally to all teams
 */
const adminModifyAssetOutcome = async (req, res) => {
  try {
    const {
      teamId,
      applyToAll,
      stockRate,
      bankRate,
      goldRate,
      rateMode // 'MULTIPLIER' | 'PERCENT'
    } = req.body;

    // Helper: Convert input (multiplier or percentage) to percentage value
    const parseToPercent = (val) => {
      if (val === undefined || val === null || val === '') return null;
      const num = Number(val);
      if (isNaN(num)) return null;
      if (rateMode === 'MULTIPLIER') {
        // Multiplier e.g. 1.02 -> (1.02 - 1) * 100 = 2%
        return Math.round((num - 1) * 10000) / 100;
      }
      // If user typed e.g. 1.02 without selecting multiplier mode, auto-detect:
      if (num > 0.05 && num < 3.0 && String(val).includes('.')) {
        return Math.round((num - 1) * 10000) / 100;
      }
      return num;
    };

    const newStockPercent = parseToPercent(stockRate);
    const newBankPercent = parseToPercent(bankRate);
    const newGoldPercent = parseToPercent(goldRate);

    if (newStockPercent === null && newBankPercent === null && newGoldPercent === null) {
      return res.status(400).json({ success: false, message: 'Please specify at least one rate (Stock, Bank, or Gold) in percentage or multiplier format (e.g. 1.02).' });
    }

    let targetTeams = [];
    if (applyToAll) {
      targetTeams = await Team.find({ status: { $ne: 'ELIMINATED' } });
    } else {
      if (!teamId) {
        return res.status(400).json({ success: false, message: 'Team ID is required when not applying globally.' });
      }
      const team = await Team.findOne({ teamId: teamId.trim().toUpperCase() });
      if (!team) {
        return res.status(404).json({ success: false, message: 'Team not found.' });
      }
      targetTeams = [team];
    }

    let updatedCount = 0;

    for (const team of targetTeams) {
      let portfolio = await Portfolio.findOne({ team: team._id });
      if (!portfolio) {
        portfolio = new Portfolio({
          team: team._id,
          cash: team.currentCapital,
          bank: 0,
          stocks: 0,
          gold: 0
        });
      }

      if (newStockPercent !== null) portfolio.stockReturnPercent = newStockPercent;
      if (newBankPercent !== null) portfolio.bankReturnPercent = newBankPercent;
      if (newGoldPercent !== null) portfolio.goldReturnPercent = newGoldPercent;

      const newValuation = portfolio.calculateValuation();
      await portfolio.save();

      const previousBalance = team.currentCapital;
      team.currentCapital = newValuation;

      if (newValuation < 1000) {
        team.status = 'DISQUALIFIED';
      } else if (team.status === 'DISQUALIFIED' && newValuation >= 1000) {
        team.status = 'ACTIVE';
      }
      await team.save();

      const detailsStr = [
        newStockPercent !== null ? `Stocks: ${newStockPercent >= 0 ? '+' : ''}${newStockPercent}%` : null,
        newBankPercent !== null ? `Bank: ${newBankPercent >= 0 ? '+' : ''}${newBankPercent}%` : null,
        newGoldPercent !== null ? `Gold: ${newGoldPercent >= 0 ? '+' : ''}${newGoldPercent}%` : null
      ].filter(Boolean).join(', ');

      const txn = await Transaction.create({
        transactionId: generateTransactionId(),
        team: team._id,
        type: 'ROUND1_STOCK_UPDATE',
        amount: newValuation - previousBalance,
        previousBalance,
        newBalance: newValuation,
        reason: `Market Outcome Applied (${detailsStr})`,
        round: 1,
        performedBy: req.user.adminId,
        metadata: {
          stockPercent: newStockPercent,
          bankPercent: newBankPercent,
          goldPercent: newGoldPercent
        }
      });

      emitToTeam(team.teamId, 'balance_updated', {
        teamId: team.teamId,
        currentCapital: team.currentCapital,
        portfolio,
        latestTransaction: txn
      });

      updatedCount++;
    }

    // Also update GameSettings global rates if applied to all
    if (applyToAll) {
      const settings = await getActiveSettings();
      if (newStockPercent !== null) settings.stockReturnPercent = newStockPercent;
      if (newBankPercent !== null) settings.bankReturnPercent = newBankPercent;
      if (newGoldPercent !== null) settings.goldReturnPercent = newGoldPercent;
      await settings.save();
    }

    await logAdminAction({
      adminId: req.user.adminId,
      action: 'STOCK_RESULT_MODIFIED',
      targetTeam: applyToAll ? 'ALL_TEAMS' : teamId,
      details: {
        applyToAll,
        updatedCount,
        stockPercent: newStockPercent,
        bankPercent: newBankPercent,
        goldPercent: newGoldPercent
      },
      ip: req.ip
    });

    emitLeaderboardUpdate({ trigger: 'asset_multipliers_updated' });

    return res.status(200).json({
      success: true,
      message: `Successfully applied market outcome (${[
        newStockPercent !== null ? `Stocks: ${(1 + newStockPercent/100).toFixed(2)}x` : null,
        newBankPercent !== null ? `Bank: ${(1 + newBankPercent/100).toFixed(2)}x` : null,
        newGoldPercent !== null ? `Gold: ${(1 + newGoldPercent/100).toFixed(2)}x` : null
      ].filter(Boolean).join(', ')}) to ${updatedCount} team(s).`
    });
  } catch (error) {
    console.error('Error modifying asset outcomes:', error);
    return res.status(500).json({ success: false, message: 'Failed to update asset outcomes.' });
  }
};

// ==========================================
// ROUND 2: 4 ARENA TASKS & QUICK SCORING
// ==========================================

/**
 * Get all 4 Round 2 task definitions and team participation history
 */
const getRound2Tasks = async (req, res) => {
  try {
    const taskDefs = Object.values(ROUND2_TASK_DEFINITIONS);
    let teamTasks = [];
    let activeTask = null;
    let lastCompletedTaskKey = null;

    if (req.user && req.user.team) {
      const teamId = req.user.team._id || req.user.team;
      teamTasks = await Round2Task.find({ team: teamId }).sort({ createdAt: -1 });

      activeTask = teamTasks.find((t) => t.status === 'ENTERED') || null;
      const lastCompleted = teamTasks.find((t) => ['WON', 'LOST', 'SCORED'].includes(t.status));
      if (lastCompleted) {
        lastCompletedTaskKey = lastCompleted.taskKey;
      }
    }

    const tasks = taskDefs.map((def) => {
      const entriesForThisTask = teamTasks.filter((t) => t.taskKey === def.key);
      const isCurrentlyEntered = activeTask && activeTask.taskKey === def.key;
      const isCooldown = !activeTask && lastCompletedTaskKey === def.key;
      const timesPlayed = entriesForThisTask.filter((t) => ['WON', 'LOST', 'SCORED'].includes(t.status)).length;
      const lastEntry = entriesForThisTask[0] || null;

      return {
        ...def,
        isCurrentlyEntered,
        isCooldown,
        timesPlayed,
        lastResult: lastEntry && lastEntry.status !== 'ENTERED' ? lastEntry.status : null,
        lastReward: lastEntry ? lastEntry.rewardAmount : 0,
        lastLoss: lastEntry ? lastEntry.lossAmount : 0
      };
    });

    return res.status(200).json({
      success: true,
      tasks,
      teamTasks,
      activeTask,
      lastCompletedTaskKey
    });
  } catch (error) {
    console.error('Error getting Round 2 tasks:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving tasks.' });
  }
};

/**
 * Enter / Register a team into a Round 2 task (deducts entry fee)
 * Rule: Teams can replay a game, BUT only after playing a different task first.
 */
const enterRound2Task = async (req, res) => {
  try {
    const { taskKey, teamId: requestedTeamId } = req.body;

    if (!taskKey || !ROUND2_TASK_DEFINITIONS[taskKey]) {
      return res.status(400).json({ success: false, message: 'Invalid task specified.' });
    }

    const taskDef = ROUND2_TASK_DEFINITIONS[taskKey];
    let team = null;

    if (req.user.role === 'ADMIN') {
      if (!requestedTeamId) {
        return res.status(400).json({ success: false, message: 'Team ID required for admin task entry.' });
      }
      team = await Team.findOne({ teamId: requestedTeamId.trim().toUpperCase() });
    } else {
      team = await Team.findById(req.user.team._id || req.user.team);
    }

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    // Check elimination
    if (team.currentCapital < 1000 || team.status === 'DISQUALIFIED' || team.status === 'ELIMINATED') {
      return res.status(403).json({
        success: false,
        message: 'Your team has been ELIMINATED (Capital below ₹1,000) and cannot participate in tasks.'
      });
    }

    // 1. Check if team already has an active challenge in progress
    const activeTask = await Round2Task.findOne({
      team: team._id,
      status: 'ENTERED'
    });
    if (activeTask) {
      return res.status(400).json({
        success: false,
        message: `Your team is currently in the arena for "${activeTask.taskName}". You must complete that challenge and be scored before entering another task.`
      });
    }

    // 2. Check alternation / consecutive replay rule
    const lastCompletedTask = await Round2Task.findOne({
      team: team._id,
      status: { $in: ['WON', 'LOST', 'SCORED'] }
    }).sort({ updatedAt: -1, createdAt: -1 });

    if (lastCompletedTask && lastCompletedTask.taskKey === taskKey) {
      return res.status(400).json({
        success: false,
        message: `Cooldown active: You just played "${taskDef.name}". You must play a different task before replaying "${taskDef.name}" again.`
      });
    }

    // Check if team has enough capital to pay entry fee and stay >= ₹1,000
    if (team.currentCapital - taskDef.entryFee < 1000) {
      return res.status(400).json({
        success: false,
        message: `Insufficient capital. Paying entry fee ₹${taskDef.entryFee} would leave your team with ₹${team.currentCapital - taskDef.entryFee}, dropping below the ₹1,000 survival threshold.`
      });
    }

    // Deduct entry fee atomically
    const updatedTeam = await Team.findOneAndUpdate(
      { _id: team._id, currentCapital: { $gte: taskDef.entryFee + 1000 } },
      { $inc: { currentCapital: -taskDef.entryFee } },
      { new: true }
    );

    if (!updatedTeam) {
      return res.status(400).json({ success: false, message: 'Transaction rejected: Insufficient balance or survival threshold violated.' });
    }

    // Update portfolio with waterfall deduction: Cash -> Bank -> Gold -> Stocks
    let portfolio = await Portfolio.findOne({ team: team._id });
    if (!portfolio) {
      portfolio = new Portfolio({ team: team._id, cash: team.currentCapital });
    }
    portfolio.deductFunds(taskDef.entryFee);
    await portfolio.save();

    // Create Round2Task record
    const taskRecord = await Round2Task.create({
      team: team._id,
      taskKey: taskDef.key,
      taskName: taskDef.name,
      entryFeePaid: taskDef.entryFee,
      status: 'ENTERED',
      multiplierApplied: 1.0,
      rewardAmount: 0,
      scoredBy: req.user.role === 'ADMIN' ? req.user.adminId : null
    });

    // Transaction
    const txn = await Transaction.create({
      transactionId: generateTransactionId(),
      team: team._id,
      type: 'ROUND2_TASK_ENTRY',
      amount: -taskDef.entryFee,
      previousBalance: team.currentCapital,
      newBalance: updatedTeam.currentCapital,
      reason: `Task Entry Fee: "${taskDef.name}" (Diff: ${taskDef.difficulty}, Risk: ${taskDef.risk})`,
      round: 2,
      performedBy: req.user.role === 'ADMIN' ? req.user.adminId : req.user.email,
      metadata: { taskId: taskRecord._id, taskKey: taskDef.key }
    });

    emitToTeam(team.teamId, 'balance_updated', {
      teamId: team.teamId,
      currentCapital: updatedTeam.currentCapital,
      portfolio,
      latestTransaction: txn
    });
    emitLeaderboardUpdate({ trigger: 'task_entry' });

    return res.status(200).json({
      success: true,
      message: `Enrolled in "${taskDef.name}". Entry fee of ₹${taskDef.entryFee} deducted.`,
      team: {
        teamId: updatedTeam.teamId,
        newBalance: updatedTeam.currentCapital
      },
      taskRecord
    });
  } catch (error) {
    console.error('Error entering Round 2 task:', error);
    return res.status(500).json({ success: false, message: 'Server error entering task.' });
  }
};

/**
 * Admin scores a Round 2 task (WIN with reward multiplier / LOSS / CUSTOM)
 */
const scoreRound2Task = async (req, res) => {
  try {
    const {
      teamId,
      taskKey,
      result, // 'WIN' | 'LOSS' | 'PENALTY' | 'CUSTOM'
      customMultiplier,
      customAmount,
      lossAmount,
      customPenalty,
      notes
    } = req.body;

    if (!teamId || !taskKey) {
      return res.status(400).json({ success: false, message: 'Team ID and Task Key are required.' });
    }

    const taskDef = ROUND2_TASK_DEFINITIONS[taskKey];
    if (!taskDef) {
      return res.status(400).json({ success: false, message: 'Invalid task key.' });
    }

    const team = await Team.findOne({ teamId: teamId.trim().toUpperCase() });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    let taskRecord = await Round2Task.findOne({
      team: team._id,
      taskKey,
      status: 'ENTERED'
    }).sort({ createdAt: -1 });

    let entryFeeDeducted = taskDef.entryFee;

    // If team didn't pre-register, auto-deduct entry fee as part of scoring
    if (!taskRecord) {
      if (team.currentCapital - entryFeeDeducted < 1000) {
        return res.status(400).json({
          success: false,
          message: `Team capital (₹${team.currentCapital.toLocaleString('en-IN')}) is insufficient for ₹${entryFeeDeducted} entry fee (must stay >= ₹1,000).`
        });
      }
      taskRecord = await Round2Task.create({
        team: team._id,
        taskKey: taskDef.key,
        taskName: taskDef.name,
        entryFeePaid: entryFeeDeducted,
        status: 'ENTERED',
        scoredBy: req.user.adminId
      });
      // Deduct entry fee using waterfall
      await Team.updateOne({ _id: team._id }, { $inc: { currentCapital: -entryFeeDeducted } });
      let entryPortfolio = await Portfolio.findOne({ team: team._id });
      if (!entryPortfolio) entryPortfolio = new Portfolio({ team: team._id, cash: team.currentCapital });
      entryPortfolio.deductFunds(entryFeeDeducted);
      await entryPortfolio.save();
      team.currentCapital -= entryFeeDeducted;
    }

    let payoutAmount = 0;
    let penaltyAmount = 0;
    let multiplierUsed = 1.0;
    const cleanResult = (result || 'WIN').toUpperCase();

    if (cleanResult === 'WIN') {
      multiplierUsed = Number(customMultiplier) || taskDef.defaultMultiplier;
      payoutAmount = Math.round(taskDef.entryFee * multiplierUsed);
    } else if (cleanResult === 'CUSTOM') {
      payoutAmount = Number(customAmount) || 0;
      multiplierUsed = Number(customMultiplier) || 1.0;
    } else if (cleanResult === 'LOSS' || cleanResult === 'PENALTY') {
      // LOSS / PENALTY: Deducts money based on risk and difficulty level or custom penalty
      multiplierUsed = 0;
      payoutAmount = 0;

      const requestedPenalty = lossAmount !== undefined && lossAmount !== null && lossAmount !== ''
        ? Number(lossAmount)
        : (customPenalty !== undefined && customPenalty !== null && customPenalty !== '' ? Number(customPenalty) : null);

      if (requestedPenalty !== null && !isNaN(requestedPenalty)) {
        penaltyAmount = Math.abs(requestedPenalty);
      } else {
        penaltyAmount = taskDef.defaultLossPenalty || taskDef.entryFee;
      }
    }

    let updatedTeam = team;
    let balanceDelta = 0;
    let portfolio = await Portfolio.findOne({ team: team._id });
    if (!portfolio) {
      portfolio = new Portfolio({ team: team._id, cash: team.currentCapital });
    }

    if (payoutAmount > 0) {
      // Credit win payout into liquid cash
      balanceDelta = payoutAmount;
      updatedTeam = await Team.findByIdAndUpdate(
        team._id,
        { $inc: { currentCapital: payoutAmount } },
        { new: true }
      );
      portfolio.addFunds(payoutAmount);
      await portfolio.save();
    } else if (penaltyAmount > 0) {
      // Deduct loss penalty using waterfall: Cash -> Bank -> Gold -> Stocks
      balanceDelta = -penaltyAmount;
      updatedTeam = await Team.findByIdAndUpdate(
        team._id,
        { $inc: { currentCapital: -penaltyAmount } },
        { new: true }
      );
      portfolio.deductFunds(penaltyAmount);
      await portfolio.save();
    }

    // Check elimination (< ₹1,000)
    let isNowEliminated = false;
    if (updatedTeam.currentCapital < 1000) {
      updatedTeam.status = 'DISQUALIFIED';
      updatedTeam.isEliminated = true;
      await updatedTeam.save();
      isNowEliminated = true;
    } else if (updatedTeam.status === 'DISQUALIFIED' && updatedTeam.currentCapital >= 1000) {
      updatedTeam.status = 'ACTIVE';
      updatedTeam.isEliminated = false;
      await updatedTeam.save();
    }

    // Update task record
    taskRecord.status = cleanResult === 'WIN' ? 'WON' : (cleanResult === 'LOSS' || cleanResult === 'PENALTY' ? 'LOST' : 'SCORED');
    taskRecord.rewardAmount = payoutAmount;
    taskRecord.lossAmount = penaltyAmount;
    taskRecord.multiplierApplied = multiplierUsed;
    taskRecord.scoredBy = req.user.adminId;
    taskRecord.notes = notes || `${cleanResult}: ${taskDef.name} ${penaltyAmount > 0 ? `(-₹${penaltyAmount})` : `(+₹${payoutAmount})`}`;
    await taskRecord.save();

    // Transaction
    const txn = await Transaction.create({
      transactionId: generateTransactionId(),
      team: team._id,
      type: cleanResult === 'WIN' ? 'ROUND2_REWARD' : 'ROUND2_PENALTY',
      amount: balanceDelta,
      previousBalance: team.currentCapital,
      newBalance: updatedTeam.currentCapital,
      reason: cleanResult === 'WIN'
        ? `Task Reward [WIN]: "${taskDef.name}" (+₹${payoutAmount.toLocaleString('en-IN')})`
        : `Task Loss Penalty: "${taskDef.name}" (-₹${penaltyAmount.toLocaleString('en-IN')})`,
      round: 2,
      performedBy: req.user.adminId,
      metadata: { taskKey, multiplier: multiplierUsed, result: cleanResult, penaltyAmount, payoutAmount }
    });

    await logAdminAction({
      adminId: req.user.adminId,
      action: 'ROUND2_TASK_SCORED',
      targetTeam: team.teamId,
      details: {
        taskName: taskDef.name,
        result: cleanResult,
        payoutAmount,
        penaltyAmount,
        multiplier: multiplierUsed,
        newBalance: updatedTeam.currentCapital
      },
      ip: req.ip
    });

    emitToTeam(team.teamId, 'balance_updated', {
      teamId: team.teamId,
      currentCapital: updatedTeam.currentCapital,
      portfolio,
      latestTransaction: txn
    });
    emitLeaderboardUpdate({ trigger: 'task_scored' });

    let resultMsg = '';
    if (cleanResult === 'WIN') {
      resultMsg = `Recorded WIN for ${team.name} on "${taskDef.name}"! Credited ₹${payoutAmount.toLocaleString('en-IN')} reward (+${multiplierUsed}x).`;
    } else if (penaltyAmount > 0) {
      resultMsg = `Recorded LOSS for ${team.name} on "${taskDef.name}"! Deducted ₹${penaltyAmount.toLocaleString('en-IN')} penalty from team capital.`;
    } else {
      resultMsg = `Recorded ${cleanResult} for ${team.name} on "${taskDef.name}".`;
    }

    if (isNowEliminated) {
      resultMsg += ` ⚠️ TEAM ELIMINATED: Capital is now ₹${updatedTeam.currentCapital.toLocaleString('en-IN')} (below ₹1,000 threshold)!`;
    }

    return res.status(200).json({
      success: true,
      message: resultMsg,
      team: {
        teamId: updatedTeam.teamId,
        newBalance: updatedTeam.currentCapital,
        isEliminated: isNowEliminated
      },
      taskRecord
    });
  } catch (error) {
    console.error('Error scoring Round 2 task:', error);
    return res.status(500).json({ success: false, message: 'Server error scoring task.' });
  }
};

/**
 * Admin Quick Money Update (ADD / SUBTRACT) - Fast manual fallback
 */
const adminQuickMoneyUpdate = async (req, res) => {
  try {
    const { teamId, amount, action, reason } = req.body;

    if (!teamId || !amount || !action || !reason) {
      return res.status(400).json({ success: false, message: 'All fields (Team ID, Amount, Action, Reason) are required.' });
    }

    const numAmount = Math.floor(Number(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number greater than ₹0.' });
    }

    const cleanAction = action.trim().toUpperCase();
    if (!['ADD', 'SUBTRACT'].includes(cleanAction)) {
      return res.status(400).json({ success: false, message: 'Action must be ADD or SUBTRACT.' });
    }

    const cleanTeamId = teamId.trim().toUpperCase();
    const team = await Team.findOne({ teamId: cleanTeamId });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    const settings = await getActiveSettings();
    const currentRound = settings.currentRound || 2;

    const previousBalance = team.currentCapital;
    let balanceDelta = cleanAction === 'ADD' ? numAmount : -numAmount;

    if (cleanAction === 'SUBTRACT' && previousBalance < numAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Team currently holds ₹${previousBalance.toLocaleString('en-IN')}; cannot deduct ₹${numAmount.toLocaleString('en-IN')}.`
      });
    }

    // Atomic balance update preventing race conditions
    const updatedTeam = await Team.findOneAndUpdate(
      { _id: team._id, currentCapital: { $gte: cleanAction === 'SUBTRACT' ? numAmount : 0 } },
      { $inc: { currentCapital: balanceDelta } },
      { new: true }
    );

    if (!updatedTeam) {
      return res.status(400).json({ success: false, message: 'Transaction rejected due to concurrent balance change. Please retry.' });
    }

    // Check elimination status (capital < 1000)
    if (updatedTeam.currentCapital < 1000) {
      updatedTeam.status = 'DISQUALIFIED';
      await updatedTeam.save();
    } else if (updatedTeam.status === 'DISQUALIFIED' && updatedTeam.currentCapital >= 1000) {
      updatedTeam.status = 'ACTIVE';
      await updatedTeam.save();
    }

    // Update portfolio with waterfall deduction or cash addition
    let portfolio = await Portfolio.findOne({ team: team._id });
    if (!portfolio) {
      portfolio = new Portfolio({ team: team._id, cash: previousBalance });
    }
    if (cleanAction === 'SUBTRACT') {
      portfolio.deductFunds(numAmount);
    } else {
      portfolio.addFunds(numAmount);
    }
    await portfolio.save();

    const txnType = cleanAction === 'ADD'
      ? (currentRound === 2 ? 'ROUND2_REWARD' : 'ADMIN_CREDIT')
      : (currentRound === 2 ? 'ROUND2_PENALTY' : 'ADMIN_DEBIT');

    const txn = await Transaction.create({
      transactionId: generateTransactionId(),
      team: team._id,
      type: txnType,
      amount: balanceDelta,
      previousBalance,
      newBalance: updatedTeam.currentCapital,
      reason: reason.trim(),
      round: currentRound,
      performedBy: req.user.adminId
    });

    await logAdminAction({
      adminId: req.user.adminId,
      action: cleanAction === 'ADD' ? 'MONEY_ADDED' : 'MONEY_SUBTRACTED',
      targetTeam: updatedTeam.teamId,
      details: {
        amount: numAmount,
        action: cleanAction,
        reason: reason.trim(),
        previousBalance,
        newBalance: updatedTeam.currentCapital,
        round: currentRound
      },
      ip: req.ip
    });

    emitToTeam(updatedTeam.teamId, 'balance_updated', {
      teamId: updatedTeam.teamId,
      currentCapital: updatedTeam.currentCapital,
      portfolio,
      latestTransaction: txn
    });
    emitLeaderboardUpdate({ trigger: 'admin_money_update' });

    return res.status(200).json({
      success: true,
      message: `Transaction successful! ₹${numAmount.toLocaleString('en-IN')} ${cleanAction === 'ADD' ? 'credited to' : 'debited from'} ${updatedTeam.name}.`,
      team: {
        teamId: updatedTeam.teamId,
        name: updatedTeam.name,
        previousBalance,
        newBalance: updatedTeam.currentCapital
      },
      transaction: txn
    });
  } catch (error) {
    console.error('Error updating money:', error);
    return res.status(500).json({ success: false, message: 'Server error updating team balance.' });
  }
};

/**
 * Legacy stub for Round 3 (permanently removed from tournament rules)
 */
const executeRound3Transfer = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Round 3 has been removed from tournament rules. The competition consists of 2 rounds only.'
  });
};

module.exports = {
  allocateRound1Portfolio,
  adminModifyAssetOutcome,
  adminQuickMoneyUpdate,
  getRound2Tasks,
  enterRound2Task,
  scoreRound2Task,
  executeRound3Transfer
};
