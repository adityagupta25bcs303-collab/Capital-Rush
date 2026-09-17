const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'ADMIN_LOGIN',
      'TEAM_VIEWED',
      'MONEY_ADDED',
      'MONEY_SUBTRACTED',
      'INVESTMENT_MODIFIED',
      'STOCK_RESULT_MODIFIED',
      'ROUND2_TASK_SCORED',
      'ROUND2_TASK_ENTERED',
      'ROUND_CHANGED',
      'GAME_STATUS_CHANGED',
      'TEAM_CREATED',
      'TEAM_EDITED',
      'USER_CREATED',
      'USER_DELETED',
      'PASSWORD_RESET',
      'USER_STATUS_UPDATED',
      'SYSTEM_RESET'
    ]
  },
  targetTeam: {
    type: String,
    default: null
  },
  targetUser: {
    type: String,
    default: null
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
