const mongoose = require('mongoose');

const gameSettingsSchema = new mongoose.Schema({
  startingCapital: {
    type: Number,
    default: 10000,
    required: true,
    min: 0
  },
  minimumCash: {
    type: Number,
    default: 2000,
    required: true,
    min: 0
  },
  bankReturnPercent: {
    type: Number,
    default: 5,
    required: true
  },
  goldReturnPercent: {
    type: Number,
    default: 8,
    required: true
  },
  currentRound: {
    type: Number,
    enum: [1, 2, 3],
    default: 1,
    required: true
  },
  gameStatus: {
    type: String,
    enum: ['NOT_STARTED', 'LIVE', 'FINISHED'],
    default: 'NOT_STARTED',
    required: true
  },
  announcement: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('GameSettings', gameSettingsSchema);
