// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const dbConfig = require('../config/database');

// Register a new user
const register = async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if email already exists
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    // Check if username already exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    // Save user to database
    const savedUser = await newUser.save();

    // Create and assign token
    const token = jwt.sign(
      { id: savedUser._id, username: savedUser.username },
      dbConfig.jwtSecret,
      { expiresIn: '5h' }
    );

    // Return success
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Login user
// const login = async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     // Validate input
//     if (!username || !password) {
//       return res.status(400).json({ success: false, message: 'Please provide username and password' });
//     }

//     // Find user
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     // Check password
//     const validPassword = await bcrypt.compare(password, user.password);
//     if (!validPassword) {
//       return res.status(401).json({ success: false, message: 'Invalid password' });
//     }

//     // Create and assign token
//     const token = jwt.sign(
//       { id: user._id, username: user.username },
//       dbConfig.jwtSecret,
//       { expiresIn: '5h' }
//     );

//     // Return success
//     return res.status(200).json({
//       success: true,
//       message: 'Login successful',
//       token,
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email
//       }
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     return res.status(500).json({ success: false, message: 'Server error' });
//   }
// };

// controllers/authController.js

// Login user
const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if ((!username && !email) || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide email (or username) and password' });
    }

    // Find user by email or username
    const user = await User.findOne(
      email 
        ? { email: email.toLowerCase() } 
        : { username }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Create and assign token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      dbConfig.jwtSecret,
      { expiresIn: '5h' }
    );

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile || {},
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Export controller functions
module.exports = {
  register,
  login,
  getCurrentUser
};
