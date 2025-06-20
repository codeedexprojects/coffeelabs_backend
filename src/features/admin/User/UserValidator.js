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
    .isIn(['customer', 'admin', 'manager']).withMessage('Invalid role')
];