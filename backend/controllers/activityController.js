const Activity = require('../models/Activity');

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

exports.recordActivity = async ({ user, type, message, resourceType = null, resourceId = null }) => {
  try {
    await Activity.create({ user, type, message, resourceType, resourceId });
  } catch (err) {
    console.error('Activity log error:', err);
  }
};
