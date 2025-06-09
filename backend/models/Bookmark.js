const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: String,
  progress: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'need-review'],
    default: 'not-started'
  },
  personalRating: {
    type: Number,
    min: 1,
    max: 5
  },
  timeSpent: {
    type: Number,
    default: 0 // in minutes
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastAttempt: Date,
  folder: {
    type: String,
    default: 'default'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate bookmarks
bookmarkSchema.index({ user: 1, problem: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);