const mongoose = require('mongoose');

const ROUND2_TASK_DEFINITIONS = {
  WHO_AM_I: {
    key: 'WHO_AM_I',
    name: 'Who Am I',
    difficulty: 'Medium',
    risk: 'Medium',
    entryFee: 300,
    defaultMultiplier: 2.0, // Returns ₹600 on win (+₹300 net)
    description: 'Guess the financial identity or company profile from clues within 60 seconds.'
  },
  BOUNCE_THE_BALL: {
    key: 'BOUNCE_THE_BALL',
    name: 'Bounce The Ball',
    difficulty: 'Easy',
    risk: 'Easy',
    entryFee: 200,
    defaultMultiplier: 1.5, // Returns ₹300 on win (+₹100 net)
    description: 'Keep the ball bouncing on a paddle for the designated time limit without dropping.'
  },
  EAT_THE_COOKIES: {
    key: 'EAT_THE_COOKIES',
    name: 'Eat The Cookies',
    difficulty: 'Moderately Hard',
    risk: 'Medium-High',
    entryFee: 400,
    defaultMultiplier: 2.5, // Returns ₹1,000 on win (+₹600 net)
    description: 'Face-cookie transfer challenge without hands into mouth in rapid succession.'
  },
  RUN_WITH_THE_PEN: {
    key: 'RUN_WITH_THE_PEN',
    name: 'Run With The Pen',
    difficulty: 'Hard',
    risk: 'Hard',
    entryFee: 600,
    defaultMultiplier: 3.5, // Returns ₹2,100 on win (+₹1,500 net)
    description: 'Sprint through high-agility campus obstacle run balancing a pen with teammate.'
  }
};

const round2TaskSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  taskKey: {
    type: String,
    enum: ['WHO_AM_I', 'BOUNCE_THE_BALL', 'EAT_THE_COOKIES', 'RUN_WITH_THE_PEN'],
    required: true
  },
  taskName: {
    type: String,
    required: true
  },
  entryFeePaid: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['ENTERED', 'WON', 'LOST', 'SCORED'],
    default: 'ENTERED'
  },
  multiplierApplied: {
    type: Number,
    default: 1.0
  },
  rewardAmount: {
    type: Number,
    default: 0
  },
  scoredBy: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Compound index so a team's task records can be queried quickly
round2TaskSchema.index({ team: 1, taskKey: 1 });

module.exports = {
  Round2Task: mongoose.model('Round2Task', round2TaskSchema),
  ROUND2_TASK_DEFINITIONS
};
