const Team = require('../models/Team');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const Transfer = require('../models/Transfer');
const GameSettings = require('../models/GameSettings');
const { logAdminAction } = require('../services/auditService');
const { generateTransactionId, generateTransferId } = require('../utils/idGenerator');
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
 * Participant allocates money across Cash, Bank, Stocks, Gold
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

    const { cash, bank, stocks, gold } = req.body;
    const numCash = Math.floor(Number(cash) || 0);
    const numBank = Math.floor(Number(bank) || 0);
    const numStocks = Math.floor(Number(stocks) || 0);
    const numGold = Math.floor(Number(gold) || 0);

    if (numCash < 0 || numBank < 0 || numStocks < 0 || numGold < 0) {
      return res.status(400).json({ success: false, message: 'Allocation amounts must be non-negative.' });
    }

    const minCashRequired = settings.minimumCash || 2000;
    if (numCash < minCashRequired) {
      return res.status(400).json({
        success: false,
        message: `Important Rule: Every team must maintain at least ₹${minCashRequired.toLocaleString('en-IN')} in CASH.`
      });
    }

    const totalAllocated = numCash + numBank + numStocks + numGold;
    // Must equal starting capital or current baseline capital
    if (totalAllocated !== team.startingCapital && totalAllocated !== team.currentCapital) {
      return res.status(400).json({
        success: false,
        message: `Total allocated amount (₹${totalAllocated.toLocaleString('en-IN')}) must equal your capital (₹${team.startingCapital.toLocaleString('en-IN')}).`
      });
    }

    let portfolio = await Portfolio.findOne({ team: team._id });
    if (!portfolio) {
      portfolio = new Portfolio({ team: team._id });
    }

    portfolio.cash = numCash;
    portfolio.bank = numBank;
    portfolio.stocks = numStocks;
    portfolio.gold = numGold;
    portfolio.bankReturnPercent = settings.bankReturnPercent;
    portfolio.goldReturnPercent = settings.goldReturnPercent;
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
      reason: `Round 1 Portfolio Allocation (Cash: ₹${numCash}, Bank: ₹${numBank}, Stocks: ₹${numStocks}, Gold: ₹${numGold})`,
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
      message: 'Portfolio allocation saved successfully.',
      portfolio,
      currentCapital: team.currentCapital
    });
  } catch (error) {
    console.error('Error allocating portfolio:', error);
    return res.status(500).json({ success: false, message: 'Server error during investment allocation.' });
  }
};

/**
 * Admin applies stock outcome percentage (e.g. +40%, -20%, etc.) to a specific team
 */
const adminModifyStockOutcome = async (req, res) => {
  try {
    const { teamId, stockReturnPercent } = req.body;

    if (stockReturnPercent === undefined || stockReturnPercent === null) {
      return res.status(400).json({ success: false, message: 'Please specify the stock return percentage.' });
    }

    const percent = Number(stockReturnPercent);
    if (isNaN(percent)) {
      return res.status(400).json({ success: false, message: 'Stock return percentage must be a valid number.' });
    }

    const team = await Team.findOne({ teamId: teamId.trim().toUpperCase() });
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

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

    const previousReturn = portfolio.stockReturnPercent;
    portfolio.stockReturnPercent = percent;
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

    const sign = percent >= 0 ? `+${percent}%` : `${percent}%`;
    const txn = await Transaction.create({
      transactionId: generateTransactionId(),
      team: team._id,
      type: 'ROUND1_STOCK_UPDATE',
      amount: newValuation - previousBalance,
      previousBalance,
      newBalance: newValuation,
      reason: `Stock Market Outcome: ${sign} applied to Stocks (Invested: ₹${portfolio.stocks})`,
      round: 1,
      performedBy: req.user.adminId,
      metadata: { previousReturn, newReturn: percent, stocksInvested: portfolio.stocks }
    });

    await logAdminAction({
      adminId: req.user.adminId,
      action: 'STOCK_RESULT_MODIFIED',
      targetTeam: team.teamId,
      details: {
        stocksInvested: portfolio.stocks,
        previousPercent: previousReturn,
        newPercent: percent,
        newBalance: newValuation
      },
      ip: req.ip
    });

    emitToTeam(team.teamId, 'balance_updated', {
      teamId: team.teamId,
      currentCapital: team.currentCapital,
      portfolio,
      latestTransaction: txn
    });
    emitLeaderboardUpdate({ trigger: 'stock_modifier' });

    return res.status(200).json({
      success: true,
      message: `Stock outcome ${sign} successfully applied to ${team.name}.`,
      portfolio,
      currentCapital: team.currentCapital
    });
  } catch (error) {
    console.error('Error modifying stock outcome:', error);
    return res.status(500).json({ success: false, message: 'Failed to update stock outcome.' });
  }
};

// ==========================================
// ROUND 2: PHYSICAL CHALLENGES & ADMIN QUICK MONEY
// ==========================================

/**
 * Admin Quick Money Update (ADD / SUBTRACT)
 * Crucial fast operation: Scan QR / Enter Team ID -> Amount -> ADD/SUB -> Reason -> Confirm.
 * Concurrency-safe: atomic balance adjustments.
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

    // Also update portfolio cash to keep in sync
    await Portfolio.findOneAndUpdate(
      { team: team._id },
      { $inc: { cash: balanceDelta, totalValuation: balanceDelta } }
    );

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

    // Real-time notification to the team and leaderboard
    emitToTeam(updatedTeam.teamId, 'balance_updated', {
      teamId: updatedTeam.teamId,
      currentCapital: updatedTeam.currentCapital,
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

// ==========================================
// ROUND 3: DIRECT TEAM-TO-TEAM NEGOTIATION TRANSFERS
// ==========================================

/**
 * Execute direct Round 3 transfer between teams
 */
const executeRound3Transfer = async (req, res) => {
  try {
    const settings = await getActiveSettings();

    if (settings.currentRound !== 3 || settings.gameStatus !== 'LIVE') {
      return res.status(400).json({
        success: false,
        message: 'Round 3 transfers are currently disabled. Transfers are only permitted when Round 3 is LIVE.'
      });
    }

    const { recipientTeamId, amount } = req.body;

    if (!recipientTeamId || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Recipient Team ID and transfer amount are required.' });
    }

    const numAmount = Math.floor(Number(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than ₹0.' });
    }

    const senderTeamId = req.user.team ? req.user.team.teamId : null;
    if (!senderTeamId) {
      return res.status(400).json({ success: false, message: 'Sender has no associated team.' });
    }

    const cleanRecipientId = recipientTeamId.trim().toUpperCase();
    if (cleanRecipientId === senderTeamId.toUpperCase()) {
      return res.status(400).json({ success: false, message: 'You cannot transfer money to your own team.' });
    }

    // Check sender team status & elimination
    const senderCheck = await Team.findOne({ teamId: senderTeamId });
    if (!senderCheck) {
      return res.status(404).json({ success: false, message: 'Sender team not found.' });
    }

    if (senderCheck.currentCapital < 1000 || senderCheck.status === 'DISQUALIFIED' || senderCheck.status === 'ELIMINATED') {
      return res.status(400).json({
        success: false,
        message: 'Your team has been ELIMINATED (Capital below ₹1,000) and cannot continue tournament operations.'
      });
    }

    if (senderCheck.currentCapital - numAmount < 1000) {
      return res.status(400).json({
        success: false,
        message: `Transfer rejected! Dropping below ₹1,000 causes immediate team elimination. Transferring ₹${numAmount.toLocaleString('en-IN')} would leave your team with only ₹${(senderCheck.currentCapital - numAmount).toLocaleString('en-IN')}. Minimum survival capital is ₹1,000.`
      });
    }

    // Lookup recipient team (must be ACTIVE and capital >= 1000)
    const receiverTeam = await Team.findOne({ teamId: cleanRecipientId, status: 'ACTIVE' });
    if (!receiverTeam || receiverTeam.currentCapital < 1000) {
      return res.status(404).json({ success: false, message: 'Recipient team not found or has been eliminated (Capital below ₹1,000).' });
    }

    // Atomic debit from sender with strict minimum survival balance guard (must remain >= 1000)
    const senderTeam = await Team.findOneAndUpdate(
      { teamId: senderTeamId, currentCapital: { $gte: numAmount + 1000 }, status: 'ACTIVE' },
      { $inc: { currentCapital: -numAmount } },
      { new: false } // Returns document before update so we have previousBalance
    );

    if (!senderTeam) {
      return res.status(400).json({
        success: false,
        message: 'Transaction rejected: Insufficient capital or balance would fall below the ₹1,000 tournament survival threshold.'
      });
    }

    // Credit recipient atomically
    const receiverPrevBalance = receiverTeam.currentCapital;
    const updatedReceiver = await Team.findOneAndUpdate(
      { _id: receiverTeam._id },
      { $inc: { currentCapital: numAmount } },
      { new: true }
    );

    const senderPrevBalance = senderTeam.currentCapital;
    const senderNewBalance = senderPrevBalance - numAmount;
    const receiverNewBalance = receiverPrevBalance + numAmount;

    // Update portfolios to reflect transfer in cash
    await Portfolio.findOneAndUpdate({ team: senderTeam._id }, { $inc: { cash: -numAmount, totalValuation: -numAmount } });
    await Portfolio.findOneAndUpdate({ team: receiverTeam._id }, { $inc: { cash: numAmount, totalValuation: numAmount } });

    // Record Transfer entity
    const transferId = generateTransferId();
    const transferRecord = await Transfer.create({
      transferId,
      senderTeam: senderTeam._id,
      receiverTeam: receiverTeam._id,
      amount: numAmount,
      senderPrevBalance,
      senderNewBalance,
      receiverPrevBalance,
      receiverNewBalance,
      initiatedBy: req.user.email,
      round: 3
    });

    // Create TWO linked financial records
    const senderTxn = await Transaction.create({
      transactionId: generateTransactionId(),
      team: senderTeam._id,
      type: 'ROUND3_TRANSFER_OUT',
      amount: -numAmount,
      previousBalance: senderPrevBalance,
      newBalance: senderNewBalance,
      reason: `Round 3 Transfer to ${receiverTeam.name} (${receiverTeam.teamId})`,
      round: 3,
      performedBy: req.user.email,
      metadata: { transferId, counterparty: receiverTeam.teamId, counterpartyName: receiverTeam.name }
    });

    const receiverTxn = await Transaction.create({
      transactionId: generateTransactionId(),
      team: receiverTeam._id,
      type: 'ROUND3_TRANSFER_IN',
      amount: numAmount,
      previousBalance: receiverPrevBalance,
      newBalance: receiverNewBalance,
      reason: `Round 3 Transfer from ${senderTeam.name} (${senderTeam.teamId})`,
      round: 3,
      performedBy: req.user.email,
      metadata: { transferId, counterparty: senderTeam.teamId, counterpartyName: senderTeam.name }
    });

    // Real-time broadcast to both teams and leaderboard
    emitToTeam(senderTeam.teamId, 'balance_updated', {
      teamId: senderTeam.teamId,
      currentCapital: senderNewBalance,
      latestTransaction: senderTxn
    });

    emitToTeam(receiverTeam.teamId, 'balance_updated', {
      teamId: receiverTeam.teamId,
      currentCapital: receiverNewBalance,
      latestTransaction: receiverTxn
    });

    emitLeaderboardUpdate({ trigger: 'round3_transfer' });

    return res.status(200).json({
      success: true,
      message: `Transfer successful! Transferred ₹${numAmount.toLocaleString('en-IN')} to ${receiverTeam.name}.`,
      transfer: {
        transferId,
        amount: numAmount,
        senderNewBalance,
        recipientTeam: receiverTeam.name
      }
    });
  } catch (error) {
    console.error('Error executing Round 3 transfer:', error);
    return res.status(500).json({ success: false, message: 'Server error processing transfer.' });
  }
};

module.exports = {
  allocateRound1Portfolio,
  adminModifyStockOutcome,
  adminQuickMoneyUpdate,
  executeRound3Transfer
};
