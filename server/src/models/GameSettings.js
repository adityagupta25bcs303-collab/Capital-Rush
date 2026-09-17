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
  stockReturnPercent: {
    type: Number,
    default: 0,
    required: true
  },
  minimumAssetInvestment: {
    type: Number,
    default: 1000,
    required: true
  },
  maximumTotalInvestable: {
    type: Number,
    default: 8000,
    required: true
  },
  activeRound2Task: {
    type: String,
    enum: ['WHO_AM_I', 'BOUNCE_THE_BALL', 'EAT_THE_COOKIES', 'RUN_WITH_THE_PEN'],
    default: 'WHO_AM_I'
  },
  currentRound: {
    type: Number,
    enum: [1, 2],
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
