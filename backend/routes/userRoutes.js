// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken: protect } = require('../middleware/auth');
const {
  getUserProfile,
  updateUserProfile,
  getUserStats,
  getUserStatsById,
  getSolvedProblems,
  getUserRooms,
} = require('../controllers/userController');
const { getUserActivity } = require('../controllers/activityController');

router.get('/profile', protect, getUserProfile);
router.patch('/profile', protect, updateUserProfile);
router.get('/activity', protect, getUserActivity);
router.get('/stats', protect, getUserStats);
router.get('/stats/:id', protect, getUserStatsById);
// routes/userRoutes.js
router.get('/solved', protect, getSolvedProblems);
router.get('/rooms',   protect, getUserRooms);
module.exports = router;
