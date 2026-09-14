const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  transferId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  senderTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  receiverTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  senderPrevBalance: {
    type: Number,
    required: true
  },
  senderNewBalance: {
    type: Number,
    required: true
  },
  receiverPrevBalance: {
    type: Number,
    required: true
  },
  receiverNewBalance: {
    type: Number,
    required: true
  },
  initiatedBy: {
    type: String,
    required: true
  },
  round: {
    type: Number,
    default: 3
  }
}, { timestamps: true });

module.exports = mongoose.model('Transfer', transferSchema);
