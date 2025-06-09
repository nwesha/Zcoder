const Problem = require('../models/Problem');
const Bookmark = require('../models/Bookmark');
const { recordActivity } = require('./activityController');

// Get all problems
const getProblems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      difficulty,
      category,
      search,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { isPublic: true };
    
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const problems = await Problem.find(query)
      .populate('author', 'username profile.firstName profile.lastName')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Problem.countDocuments(query);

    res.json({
      success: true,
      data: {
        problems,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single problem
const getProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .populate('author', 'username profile.firstName profile.lastName');

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Check if user has bookmarked this problem
    let isBookmarked = false;
    if (req.user) {
      const bookmark = await Bookmark.findOne({
        user: req.user.id,
        problem: problem._id
      });
      isBookmarked = !!bookmark;
    }

    // Increment attempt count
    await Problem.findByIdAndUpdate(problem._id, {
      $inc: { 'stats.attempts': 1 }
    });

    res.json({
      success: true,
      data: { 
        problem,
        isBookmarked
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create problem
const createProblem = async (req, res) => {
  try {
    const problemData = {
      ...req.body,
      author: req.user.id
    };

    const problem = await Problem.create(problemData);
    await problem.populate('author', 'username profile.firstName profile.lastName');

    res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      data: { problem }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update problem
const updateProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Check if user is the author
    if (problem.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this problem'
      });
    }

    const updatedProblem = await Problem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'username profile.firstName profile.lastName');

    res.json({
      success: true,
      message: 'Problem updated successfully',
      data: { problem: updatedProblem }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete problem
const deleteProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Check if user is the author
    if (problem.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this problem'
      });
    }

    await Problem.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Problem deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Like/Unlike problem
const likeProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    const isLiked = problem.likes.includes(req.user.id);

    if (isLiked) {
      problem.likes.pull(req.user.id);
    } else {
      problem.likes.push(req.user.id);
    }

    await problem.save();

    res.json({
      success: true,
      message: isLiked ? 'Problem unliked' : 'Problem liked',
      data: { 
        isLiked: !isLiked,
        likesCount: problem.likes.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
  likeProblem
};