const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/teams', getAllTeams);
router.post('/teams', createTeam);
router.delete('/teams/:teamId', deleteTeam);
router.get('/participants', getAllParticipants);
router.post('/participants', createParticipant);
router.put('/participants/reset-password', resetParticipantPassword);
router.patch('/participants/:userId/status', toggleParticipantStatus);
router.delete('/participants/:userId', deleteParticipant);
router.post('/system/clean-slate', resetToCleanSlate);
router.get('/audit-logs', getAuditLogs);
router.get('/transactions', getAllTransactions);

module.exports = router;
