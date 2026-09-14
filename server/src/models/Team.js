const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  startingCapital: {
    type: Number,
    default: 10000,
    required: true,
    min: 0
  },
  currentCapital: {
    type: Number,
    default: 10000,
    required: true,
    min: 0
  },
  qrCode: {
    type: String, // Data URL base64 image
    default: ''
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'DISQUALIFIED', 'ELIMINATED'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

// Virtual to check if team is eliminated (< 1000 capital or disqualified)
teamSchema.virtual('isEliminated').get(function () {
  return this.currentCapital < 1000 || this.status === 'DISQUALIFIED' || this.status === 'ELIMINATED';
});

// Virtual to calculate profit/loss
teamSchema.virtual('profitLoss').get(function () {
  return this.currentCapital - this.startingCapital;
});

// Virtual to calculate percentage return
teamSchema.virtual('returnPercentage').get(function () {
  if (this.startingCapital === 0) return 0;
  return Number((((this.currentCapital - this.startingCapital) / this.startingCapital) * 100).toFixed(2));
});

teamSchema.set('toJSON', { virtuals: true });
teamSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Team', teamSchema);
