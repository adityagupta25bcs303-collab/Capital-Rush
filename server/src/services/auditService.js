const AuditLog = require('../models/AuditLog');
const { emitToAdmin } = require('./socketService');

const logAdminAction = async ({ adminId, action, targetTeam = null, targetUser = null, details = {}, ip = '' }) => {
  try {
    const log = await AuditLog.create({
      adminId,
      action,
      targetTeam,
      targetUser,
      details,
      ip
    });

    emitToAdmin('audit_log_created', log);
    return log;
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};

module.exports = { logAdminAction };
