const express = require('express');
const verifyAdminToken = require('../../../middleware/jwtConfig');
const router = express.Router();
const UserController = require('./UserController')
const { userIdValidator, updateUserValidator } = require('./UserValidator');
const validationHandler = require('../../../middleware/validationHandler');
const { registerUserValidator } = require('../../user/auth/userValidator');

router.get('/', verifyAdminToken(['admin']), UserController.getAllUsers);
router.get('/:userId', verifyAdminToken(['admin']), userIdValidator, validationHandler, UserController.getUserById);
router.post('/', verifyAdminToken(['admin']), registerUserValidator, validationHandler, UserController.createUser);
router.patch('/:userId', verifyAdminToken(['admin']), userIdValidator, updateUserValidator, validationHandler, UserController.updateUserById);
router.delete('/:userId', verifyAdminToken(['admin']), userIdValidator, validationHandler, UserController.deleteUserById);
router.get('/:userId/cart', verifyAdminToken(['admin']), userIdValidator, validationHandler, UserController.getUserCart);

module.exports = router;