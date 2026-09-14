const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No authentication token provided.' });
    }

    const secret = process.env.JWT_SECRET || 'capital_rush_super_secret_jwt_key_2026_iiitkottayam';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id).populate('team');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or token has expired.' });
    }

    if (user.status === 'DISABLED') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated by the administrator.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Access forbidden. Administrator credentials required.' });
  }
  next();
};

const requireParticipant = (req, res, next) => {
  if (!req.user || req.user.role !== 'PARTICIPANT') {
    return res.status(403).json({ success: false, message: 'Access forbidden. Participant credentials required.' });
  }
  next();
};

module.exports = { verifyToken, requireAdmin, requireParticipant };
