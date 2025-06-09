const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Problem title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Problem description is required']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    required: true,
    enum: ['algorithms', 'data-structures', 'databases', 'system-design', 'frontend', 'backend']
  },
  starterCode: {
    javascript: String,
    python: String,
    java: String,
    cpp: String
  },
  testCases: [{
    input: String,
    expectedOutput: String,
    explanation: String
  }],
  solutions: [{
    language: String,
    code: String,
    explanation: String,
    timeComplexity: String,
    spaceComplexity: String
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  stats: {
    attempts: { type: Number, default: 0 },
    solved: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for better search performance
problemSchema.index({ title: 'text', description: 'text', tags: 'text' });
problemSchema.index({ difficulty: 1, category: 1 });

module.exports = mongoose.model('Problem', problemSchema);