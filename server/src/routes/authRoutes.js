const express = require('express');
const router = express.Router();
const { loginParticipant, loginAdmin, getMe, registerParticipant } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/participant/login', loginParticipant);
router.post('/participant/register', registerParticipant);
router.post('/admin/login', loginAdmin);
router.get('/me', verifyToken, getMe);

module.exports = router;
