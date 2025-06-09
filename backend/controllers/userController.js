// controllers/userController.js
const User = require('../models/User');
const Bookmark = require('../models/Bookmark');
const Activity = require('../models/Activity');
const Room = require('../models/Room');
// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('bookmarkedProblems.problem')
      .populate('solvedProblems.problem')
      .populate('recentRooms');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

     const payload = {
      ...user.profile,
      createdAt: user.createdAt,    // <-- bring createdAt down
    };
    
    return res.status(200).json({
      success: true,
      data: {
        profile: user.profile || {}
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getUserActivity = async (req, res) => {
  const activities = await Activity.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20);
  res.json({ success: true, data: { activities } });
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, github, linkedin, website } = req.body;
    
    // Find user and update profile
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        profile: {
          firstName,
          lastName,
          bio,
          github,
          linkedin,
          website
        }
      },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get user activity
const getUserActivity = async (req, res) => {
  try {
    // In a real app, you would fetch this from an activity collection
    // For this example, we'll return dummy data
    return res.status(200).json({
      success: true,
      data: {
        activities: [
          {
            _id: '1',
            type: 'problem',
            message: 'Solved a problem: "Two Sum"',
            createdAt: new Date()
          },
          {
            _id: '2',
            type: 'room',
            message: 'Joined a room: "Algorithm Study Group"',
            createdAt: new Date()
          },
          {
            _id: '3',
            type: 'bookmark',
            message: 'Bookmarked a problem: "Valid Parentheses"',
            createdAt: new Date()
          }
        ]
      }
    });
  } catch (error) {
    console.error('Get activity error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get user stats
// const getUserStats = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
    
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }
    
//     // Calculate stats (in a real app, you might query related collections)
//     return res.status(200).json({
//       success: true,
//       data: {
//         stats: {
//           totalProblems: user.solvedProblems?.length || 0,
//           totalBookmarks: user.bookmarkedProblems?.length || 0,
//           totalRooms: user.recentRooms?.length || 0,
//           totalCollaborations: 5 // Dummy value
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get stats error:', error);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

exports.getUserStats = async (req, res) => {
  const userId = req.user.id;
  const totalBookmarks = await Bookmark.countDocuments({ user: userId });
  const totalProblems = await Bookmark.countDocuments({ user: userId, progress: 'completed' });
  const totalRooms = await Room.countDocuments({ 'participants.user': userId });
  // you can count collaborations however you define them—for example, chat messages
  const totalCollaborations = await Activity.countDocuments({ user: userId, type: 'chat' });
  res.json({
    success: true,
    data: {
      stats: { totalProblems, totalBookmarks, totalRooms, totalCollaborations }
    }
  });
};

// Get user stats by ID (for dashboard)
const getUserStatsById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Return stats for dashboard
    return res.status(200).json({
      success: true,
      data: {
        stats: {
          problemsSolved: user.solvedProblems?.length || 0,
          roomsJoined: 10, // Dummy value
          collaborationTime: 120 // Dummy value in minutes
        }
      }
    });
  } catch (error) {
    console.error('Get stats by ID error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSolvedProblems = async (req, res) => {
  const solvedBookmarks = await Bookmark.find({
    user: req.user.id,
    progress: 'completed'
  }).populate('problem', 'title difficulty category tags');
  const solvedProblems = solvedBookmarks.map(b => b.problem);
  res.json({ success: true, data: { solvedProblems } });
};

exports.getUserRooms = async (req, res) => {
  const rooms = await Room.find({ 'participants.user': req.user.id })
    .sort({ updatedAt: -1 })
    .limit(5)
    .select('name isActive lastActive createdAt');
  res.json({ success: true, data: { recentRooms: rooms } });
};

/**
 * GET /api/users/stats
 * Returns counts of solved problems, bookmarks, rooms joined, collaborations
 */
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const totalBookmarks = await Bookmark.countDocuments({ user: userId });
    const totalProblems = await Bookmark.countDocuments({ user: userId, progress: 'completed' });
    const totalRooms = await Room.countDocuments({ 'participants.user': userId });
    const totalCollaborations = await Activity.countDocuments({ user: userId, type: 'chat' });
    
    return res.json({
      success: true,
      data: {
        stats: { totalProblems, totalBookmarks, totalRooms, totalCollaborations }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/users/rooms
 * Returns recent rooms the user has joined
 */
const getUserRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ 'participants.user': req.user.id })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('name isActive lastActive createdAt');
    return res.json({ success: true, data: { recentRooms: rooms } });
  } catch (error) {
    console.error('Get user rooms error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserActivity,
  getUserStats,
  getUserStatsById,
  getUserRooms,
  getSolvedProblems, 
};
