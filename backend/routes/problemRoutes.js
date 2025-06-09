// routes/problemRoutes.js

const express = require('express');
const {
  getProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
  likeProblem
} = require('../controllers/problemController');
const { auth, optionalAuth } = require('../middleware/auth');
const { problemValidation, validate } = require('../utils/validators');

const router = express.Router();

// Public routes (with optional auth)
router.get('/', optionalAuth, getProblems);
router.get('/:id', optionalAuth, getProblem);

// Protected routes
router.use(auth);
router.post('/', problemValidation, validate, createProblem);
router.put('/:id', problemValidation, validate, updateProblem);
router.delete('/:id', deleteProblem);
router.post('/:id/like', likeProblem);

module.exports = router;