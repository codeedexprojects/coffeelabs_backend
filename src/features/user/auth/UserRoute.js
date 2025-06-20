const express = require('express');
const { registerUserValidator, loginUserValidator } = require('./userValidator');
const validationHandler = require('../../../middleware/validationHandler');
const userController = require('./UserController');

const router = express.Router();

router.post('/register', registerUserValidator, validationHandler, userController.registerUser);

router.post('/login', loginUserValidator, validationHandler, userController.loginUser);


module.exports = router;