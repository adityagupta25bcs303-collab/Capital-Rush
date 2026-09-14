const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    unique: true
  },
  cash: {
    type: Number,
    default: 10000,
    min: 0
  },
  bank: {
    type: Number,
    default: 0,
    min: 0
  },
  stocks: {
    type: Number,
    default: 0,
    min: 0
  },
  gold: {
    type: Number,
    default: 0,
    min: 0
  },
  stockReturnPercent: {
    type: Number,
    default: 0 // e.g. +40, -20
  },
  bankReturnPercent: {
    type: Number,
    default: 5
  },
  goldReturnPercent: {
    type: Number,
    default: 8
  },
  totalValuation: {
    type: Number,
    default: 10000
  },
  lastAllocatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

portfolioSchema.methods.calculateValuation = function () {
  const bankVal = this.bank * (1 + (this.bankReturnPercent || 0) / 100);
  const stockVal = this.stocks * (1 + (this.stockReturnPercent || 0) / 100);
  const goldVal = this.gold * (1 + (this.goldReturnPercent || 0) / 100);
  const total = Math.round(this.cash + bankVal + stockVal + goldVal);
  this.totalValuation = total;
  return total;
};

module.exports = mongoose.model('Portfolio', portfolioSchema);
