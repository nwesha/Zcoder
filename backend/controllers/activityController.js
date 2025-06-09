// controllers/activityController.js
const Activity = require('../models/Activity');

/**
 * GET /api/users/activity
 * Returns the 20 most recent activities for the authenticated user
 */
exports.getUserActivity = async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity',
      error: error.message
    });
  }
};

/**
 * Utility to record an activity. Call this from other controllers.
 * @param {Object} params
 *   - user: ObjectId
 *   - type: 'problem'|'bookmark'|'room'|'chat'|'other'
 *   - message: string
 *   - resourceType?: same as type or null
 *   - resourceId?: ObjectId
 */
exports.recordActivity = async ({ user, type, message, resourceType = null, resourceId = null }) => {
  try {
    await Activity.create({ user, type, message, resourceType, resourceId });
  } catch (err) {
    console.error('Activity log error:', err);
  }
};
