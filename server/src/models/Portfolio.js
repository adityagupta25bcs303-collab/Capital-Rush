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
  this.cash = Math.max(0, this.cash || 0);
  this.bank = Math.max(0, this.bank || 0);
  this.stocks = Math.max(0, this.stocks || 0);
  this.gold = Math.max(0, this.gold || 0);

  const bankVal = this.bank * (1 + (this.bankReturnPercent || 0) / 100);
  const stockVal = this.stocks * (1 + (this.stockReturnPercent || 0) / 100);
  const goldVal = this.gold * (1 + (this.goldReturnPercent || 0) / 100);
  const total = Math.round(this.cash + bankVal + stockVal + goldVal);
  this.totalValuation = total;
  return total;
};

/**
 * Waterfall Deduction Rule:
 * 1. Deduct first from Liquid Cash until 0.
 * 2. If Liquid Cash is exhausted, deduct remaining from Bank until 0.
 * 3. If Bank is exhausted, deduct remaining from Gold until 0.
 * 4. If Gold is exhausted, deduct remaining from Stocks until 0.
 * Asset balances will NEVER drop below 0!
 */
portfolioSchema.methods.deductFunds = function (amount) {
  let remaining = Math.max(0, Number(amount) || 0);
  if (remaining <= 0) return this.calculateValuation();

  this.cash = Math.max(0, this.cash || 0);
  this.bank = Math.max(0, this.bank || 0);
  this.gold = Math.max(0, this.gold || 0);
  this.stocks = Math.max(0, this.stocks || 0);

  // 1. Deduct from liquid cash
  if (this.cash >= remaining) {
    this.cash -= remaining;
    remaining = 0;
  } else {
    remaining -= this.cash;
    this.cash = 0;
  }

  // 2. If liquid cash is exhausted, deduct from Bank
  if (remaining > 0) {
    if (this.bank >= remaining) {
      this.bank -= remaining;
      remaining = 0;
    } else {
      remaining -= this.bank;
      this.bank = 0;
    }
  }

  // 3. If Bank is exhausted, deduct from Gold
  if (remaining > 0) {
    if (this.gold >= remaining) {
      this.gold -= remaining;
      remaining = 0;
    } else {
      remaining -= this.gold;
      this.gold = 0;
    }
  }

  // 4. If Gold is exhausted, deduct from Stocks (safety fallback)
  if (remaining > 0) {
    if (this.stocks >= remaining) {
      this.stocks -= remaining;
      remaining = 0;
    } else {
      remaining -= this.stocks;
      this.stocks = 0;
    }
  }

  this.calculateValuation();
  return remaining;
};

/**
 * Add funds (e.g. winnings, rewards, credit) to liquid cash
 */
portfolioSchema.methods.addFunds = function (amount) {
  const toAdd = Math.max(0, Number(amount) || 0);
  this.cash = Math.max(0, (this.cash || 0) + toAdd);
  this.calculateValuation();
};

/**
 * Rebalance any legacy negative cash by shifting deficit to Bank -> Gold -> Stocks
 */
portfolioSchema.methods.rebalanceNegativeCash = function () {
  if (this.cash < 0) {
    const deficit = Math.abs(this.cash);
    this.cash = 0;
    this.deductFunds(deficit);
  } else {
    this.calculateValuation();
  }
};

// Automatic pre-save invariant check
portfolioSchema.pre('save', function (next) {
  if (this.cash < 0) {
    const deficit = Math.abs(this.cash);
    this.cash = 0;
    this.deductFunds(deficit);
  }
  next();
});

module.exports = mongoose.model('Portfolio', portfolioSchema);
