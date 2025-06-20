const express = require('express');
const verifyAdminToken = require('../../../middleware/jwtConfig');
const router = express.Router();
const UserController = require('./UserController')
const { userIdValidator, updateUserValidator } = require('./UserValidator');
const validationHandler = require('../../../middleware/validationHandler');

router.get('/', verifyAdminToken(['admin']), UserController.getAllUsers);
router.get('/:userId', verifyAdminToken(['admin']), userIdValidator, validationHandler, UserController.getUserById);
router.patch('/:userId', verifyAdminToken(['admin']), userIdValidator, updateUserValidator, validationHandler, UserController.updateUserById);
router.delete('/:userId', verifyAdminToken(['admin']), userIdValidator, validationHandler, UserController.deleteUserById);

module.exports = router;