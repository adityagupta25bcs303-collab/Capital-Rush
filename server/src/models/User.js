const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true,
    index: true
  },
  adminId: {
    type: String,
    uppercase: true,
    trim: true,
    sparse: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['PARTICIPANT', 'ADMIN'],
    default: 'PARTICIPANT',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'DISABLED'],
    default: 'ACTIVE'
  }
}, { timestamps: true });

// Prevent sending password hashes in JSON responses
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
