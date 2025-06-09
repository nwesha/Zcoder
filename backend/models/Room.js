// models/Room.js

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true
  },
  description: String,
  type: {
    type: String,
    enum: ['study-group', 'interview-prep', 'project-collaboration', 'open-discussion'],
    default: 'open-discussion'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: String,
  maxParticipants: {
    type: Number,
    default: 10,
    min: 2,
    max: 50
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['owner', 'moderator', 'participant'],
      default: 'participant'
    }
  }],
  currentProblem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem'
  },
  sharedCode: {
    content: String,
    language: {
      type: String,
      default: 'javascript'
    },
    lastModified: Date,
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  chatHistory: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['text', 'code', 'system'],
      default: 'text'
    }
  }],
  settings: {
    allowCodeSharing: { type: Boolean, default: true },
    allowChat: { type: Boolean, default: true },
    autoSave: { type: Boolean, default: true }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
roomSchema.index({ owner: 1, isActive: 1 });
roomSchema.index({ 'participants.user': 1 });

module.exports = mongoose.model('Room', roomSchema);