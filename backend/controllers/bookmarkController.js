const Bookmark = require('../models/Bookmark');
const Problem = require('../models/Problem');
const { recordActivity } = require('./activityController');

// Get user bookmarks
const getBookmarks = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            folder,
            tags,
            progress,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = { user: req.user.id };

        if (folder) query.folder = folder;
        if (progress) query.progress = progress;
        if (tags) query.tags = { $in: tags.split(',') };

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const bookmarks = await Bookmark.find(query)
            .populate('problem', 'title description difficulty category tags')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Bookmark.countDocuments(query);

        // Get folders for user
        const folders = await Bookmark.distinct('folder', { user: req.user.id });

        res.json({
            success: true,
            data: {
                bookmarks,
                folders,
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

// Create bookmark
const createBookmark = async (req, res) => {
    try {
        const { problemId, ...bookmarkData } = req.body;

        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }

        const existingBookmark = await Bookmark.findOne({
            user: req.user.id,
            problem: problemId
        });

        if (existingBookmark) {
            return res.status(400).json({
                success: false,
                message: 'Problem already bookmarked'
            });
        }

        const bookmark = await Bookmark.create({
            user: req.user.id,
            problem: problemId,
            ...bookmarkData
        });

        await bookmark.populate('problem', 'title description difficulty category tags');
        await recordActivity({
            user: req.user.id,
            type: 'bookmark',
            message: `Bookmarked problem: "${bookmark.problem.title}"`,
            resourceType: 'bookmark',
            resourceId: bookmark._id
        });

        res.status(201).json({
            success: true,
            message: 'Bookmark created successfully',
            data: { bookmark }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const updateBookmark = async (req, res) => {
    try {
        const bookmark = await Bookmark.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!bookmark) {
            return res.status(404).json({
                success: false,
                message: 'Bookmark not found'
            });
        }

        const updatedBookmark = await Bookmark.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('problem', 'title description difficulty category tags');

        res.json({
            success: true,
            message: 'Bookmark updated successfully',
            data: { bookmark: updatedBookmark }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

const deleteBookmark = async (req, res) => {
    try {
        const bookmark = await Bookmark.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!bookmark) {
            return res.status(404).json({
                success: false,
                message: 'Bookmark not found'
            });
        }

        await Bookmark.findByIdAndDelete(req.params.id);
        await recordActivity({
            user: req.user.id,
            type: 'bookmark',
            message: `Removed bookmark on problem: "${bookmark.problem.title}"`,
            resourceType: 'bookmark',
            resourceId: bookmark._id
        });
        res.json({
            success: true,
            message: 'Bookmark deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get bookmark by problem
const getBookmarkByProblem = async (req, res) => {
    try {
        const bookmark = await Bookmark.findOne({
            user: req.user.id,
            problem: req.params.problemId
        }).populate('problem', 'title description difficulty category tags');

        res.json({
            success: true,
            data: { bookmark }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Update bookmark progress
const updateProgress = async (req, res) => {
    try {
        const { progress, timeSpent } = req.body;

        const bookmark = await Bookmark.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!bookmark) {
            return res.status(404).json({
                success: false,
                message: 'Bookmark not found'
            });
        }

        // Update progress and other fields
        if (progress) bookmark.progress = progress;
        if (timeSpent) bookmark.timeSpent += timeSpent;
        bookmark.lastAttempt = new Date();
        bookmark.attempts += 1;

        await bookmark.save();
        await bookmark.populate('problem', 'title description difficulty category tags');

        res.json({
            success: true,
            message: 'Progress updated successfully',
            data: { bookmark }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get bookmark statistics
const getBookmarkStats = async (req, res) => {
    try {
        const stats = await Bookmark.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: '$progress',
                    count: { $sum: 1 },
                    totalTime: { $sum: '$timeSpent' }
                }
            }
        ]);

        const folders = await Bookmark.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: '$folder',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                progressStats: stats,
                folderStats: folders
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
    getBookmarks,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    getBookmarkByProblem,
    updateProgress,
    getBookmarkStats
};