const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', getSettings);
router.put('/', verifyToken, requireAdmin, updateSettings);

module.exports = router;
