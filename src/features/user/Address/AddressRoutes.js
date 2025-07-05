const express = require('express');
const addressController = require('./AddressController');
const router = express.Router();
const verifyToken = require('../../../middleware/jwtConfig');


// Apply verifyToken middleware to all routes that need authentication
router.post('/add', verifyToken(['customer']), addressController.addAddress);
router.get('/', verifyToken(['customer']), addressController.getAddresses);
router.patch('/:addressId', verifyToken(['customer']), addressController.updateAddress);
router.delete('/:addressId', verifyToken(['customer']), addressController.deleteAddress);
router.patch('/:addressId/set-default', verifyToken(['customer']), addressController.setDefaultAddress);

module.exports = router;
