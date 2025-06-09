const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3-20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Problem validation rules
const problemValidation = [
  body('title')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5-100 characters'),
  body('description')
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters'),
  body('difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('category')
    .isIn(['algorithms', 'data-structures', 'databases', 'system-design', 'frontend', 'backend'])
    .withMessage('Invalid category')
];

// Room validation rules
const roomValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Room name must be between 1-100 characters')
    .escape(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
    .escape(),
    
  body('type')
    .optional()
    .isIn(['study-group', 'interview-prep', 'project-collaboration', 'open-discussion'])
    .withMessage('Invalid room type'),
    
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),
    
  body('password')
    .optional()
    .isLength({ min: 4, max: 50 })
    .withMessage('Password must be between 4-50 characters if provided'),
    
  body('maxParticipants')
    .optional()
    .isInt({ min: 2, max: 50 })
    .withMessage('maxParticipants must be between 2-50')
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  problemValidation,
  roomValidation
};