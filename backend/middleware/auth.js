// middleware/auth.js
const jwt = require('jsonwebtoken');
const dbConfig = require('../config/database');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    // Get token from header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] || req.cookies?.auth;
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    // Verify token
    const decoded = jwt.verify(token, dbConfig.jwtSecret);
    
    // Add user from payload to request
    req.user = decoded;
    
    // Proceed to next middleware
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Primary “must-authenticate” middleware
const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.split(' ')[1] || req.cookies?.auth;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
    const decoded = jwt.verify(token, dbConfig.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Optional auth: if token present and valid, attach req.user; otherwise proceed anonymously
const optionalAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.split(' ')[1] || req.cookies?.auth;
    if (token) {
      const decoded = jwt.verify(token, dbConfig.jwtSecret);
      req.user = decoded;
    }
  } catch (err) {
    // ignore invalid token
  } finally {
    next();
  }
};

module.exports = {
  verifyToken,
  auth,
  optionalAuth
};
