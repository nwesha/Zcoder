// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { register, login, getCurrentUser } = require('../controllers/authController');

// Register new user
router.post(
  '/register',
  [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  register
);

// Login user
router.post('/login', login);

// Get current user (protected route)
router.get('/me', verifyToken, getCurrentUser);

module.exports = router;
