const express = require('express');
const router = express.Router();
const profileController = require('./ProfileController');
const { 
  updateProfileValidator, 
  changePasswordValidator 
} = require('./ProfileValidator');
const validationHandler = require('../../../middleware/validationHandler');
const verifyAdminToken = require('../../../middleware/jwtConfig');

router.get('/', 
  verifyAdminToken(), 
  profileController.getProfile
);

router.patch('/', 
  verifyAdminToken(), 
  updateProfileValidator, 
  validationHandler,
  profileController.updateProfile
);

router.put('/change-password', 
  verifyAdminToken(), 
  changePasswordValidator, 
  validationHandler,
  profileController.changePassword
);

router.delete('/', 
  verifyAdminToken(), 
  profileController.deleteAccount
);

module.exports = router;