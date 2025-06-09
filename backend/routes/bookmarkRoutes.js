// routes/bookmarkRoutes.js

const express = require('express');
const {
  getBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
  getBookmarkByProblem,
  updateProgress,
  getBookmarkStats
} = require('../controllers/bookmarkController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

router.get('/', getBookmarks);
router.post('/', createBookmark);
router.get('/stats', getBookmarkStats);
router.get('/problem/:problemId', getBookmarkByProblem);
router.put('/:id', updateBookmark);
router.put('/:id/progress', updateProgress);
router.delete('/:id', deleteBookmark);

module.exports = router;