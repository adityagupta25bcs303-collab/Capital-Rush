const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'ADMIN_CREDIT',
      'ADMIN_DEBIT',
      'ROUND1_INVESTMENT',
      'ROUND1_STOCK_UPDATE',
      'ROUND2_TASK_ENTRY',
      'ROUND2_REWARD',
      'ROUND2_PENALTY',
      'ROUND3_TRANSFER_OUT',
      'ROUND3_TRANSFER_IN',
      'INITIAL_CAPITAL',
      'SYSTEM_ADJUSTMENT'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  previousBalance: {
    type: Number,
    required: true
  },
  newBalance: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  round: {
    type: Number,
    enum: [1, 2, 3],
    required: true
  },
  performedBy: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
