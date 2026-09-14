const express = require('express');
const router = express.Router();
const {
  allocateRound1Portfolio,
  adminModifyStockOutcome,
  adminQuickMoneyUpdate,
  executeRound3Transfer
} = require('../controllers/roundController');
const { verifyToken, requireParticipant, requireAdmin } = require('../middleware/auth');

// Round 1
router.post('/round1/allocate', verifyToken, requireParticipant, allocateRound1Portfolio);
router.post('/round1/admin/stock-result', verifyToken, requireAdmin, adminModifyStockOutcome);

// Round 2 (and fast admin operations)
router.post('/round2/admin/quick-money', verifyToken, requireAdmin, adminQuickMoneyUpdate);

// Round 3
router.post('/round3/transfer', verifyToken, requireParticipant, executeRound3Transfer);

module.exports = router;
