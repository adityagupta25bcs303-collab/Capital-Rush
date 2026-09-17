const express = require('express');
const router = express.Router();
const {
  allocateRound1Portfolio,
  adminModifyAssetOutcome,
  adminQuickMoneyUpdate,
  getRound2Tasks,
  enterRound2Task,
  scoreRound2Task,
  executeRound3Transfer
} = require('../controllers/roundController');
const { verifyToken, requireParticipant, requireAdmin } = require('../middleware/auth');

// Round 1
router.post('/round1/allocate', verifyToken, requireParticipant, allocateRound1Portfolio);
router.post('/round1/admin/asset-outcome', verifyToken, requireAdmin, adminModifyAssetOutcome);
router.post('/round1/admin/stock-result', verifyToken, requireAdmin, adminModifyAssetOutcome); // alias for backwards compatibility

// Round 2 Arena Tasks & Scoring
router.get('/round2/tasks', verifyToken, getRound2Tasks);
router.post('/round2/tasks/enter', verifyToken, enterRound2Task);
router.post('/round2/tasks/score', verifyToken, requireAdmin, scoreRound2Task);
router.post('/round2/admin/quick-money', verifyToken, requireAdmin, adminQuickMoneyUpdate);

// Round 3 (Permanently deprecated)
router.post('/round3/transfer', verifyToken, executeRound3Transfer);

module.exports = router;
