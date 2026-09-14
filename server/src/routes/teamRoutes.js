const express = require('express');
const router = express.Router();
const { getMyTeam, getTeamByTeamId, lookupTeamForTransfer } = require('../controllers/teamController');
const { verifyToken, requireParticipant } = require('../middleware/auth');

router.get('/my-team', verifyToken, requireParticipant, getMyTeam);
router.get('/lookup/:teamId', verifyToken, lookupTeamForTransfer);
router.get('/:teamId', verifyToken, getTeamByTeamId);

module.exports = router;
