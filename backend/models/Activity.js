const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['problem', 'bookmark', 'room', 'chat', 'other'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  resourceType: {
    type: String,
    enum: ['problem', 'bookmark', 'room', 'chat', null],
    default: null
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
}, {
  timestamps: true
});

// Index so we can quickly fetch recent activities per user
activitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
