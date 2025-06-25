const { body, param } = require('express-validator');

exports.userIdValidator = [
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid User ID format')
];

exports.updateUserValidator = [
  param('userId').isMongoId().withMessage('Invalid User ID format'),
    
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  
  body('email')
    .optional()
    .trim()
    .normalizeEmail()
    .isEmail().withMessage('Invalid email format'),
    
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9]{10,15}$/).withMessage('Invalid phone number (10-15 digits)'),
    
  body('role')
    .optional()
    .isIn(['customer', 'admin', 'delivery']).withMessage('Invalid role')
];


exports.createUserValidator = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Name must be between 3 and 50 characters'),
  
  body('email')
    .notEmpty().withMessage('Email is required')
    .trim()
    .normalizeEmail()
    .isEmail().withMessage('Invalid email format'),
    
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .trim()
    .matches(/^[0-9]{10,15}$/).withMessage('Invalid phone number (10-15 digits)'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
  body('role')
    .optional()
    .isIn(['customer', 'admin', 'delivery']).withMessage('Invalid role')
];