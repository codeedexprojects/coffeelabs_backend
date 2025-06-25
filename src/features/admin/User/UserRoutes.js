const express = require('express');
const verifyAdminToken = require('../../../middleware/jwtConfig');
const router = express.Router();
const UserController = require('./UserController')
const { userIdValidator, updateUserValidator,createUserValidator } = require('./UserValidator');
const validationHandler = require('../../../middleware/validationHandler');

router.get('/', verifyAdminToken(['admin']), UserController.getAllUsers);
router.get('/:userId', verifyAdminToken(['admin']), userIdValidator, validationHandler, UserController.getUserById);
router.post('/', verifyAdminToken(['admin']), createUserValidator, validationHandler, UserController.createUser);
router.patch('/:userId', verifyAdminToken(['admin']), userIdValidator, updateUserValidator, validationHandler, UserController.updateUserById);
router.delete('/:userId', verifyAdminToken(['admin']), userIdValidator, validationHandler, UserController.deleteUserById);

module.exports = router;