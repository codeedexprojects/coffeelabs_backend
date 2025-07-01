const express = require('express');
const router = express.Router();
const cartController = require('./CartController');
const verifyToken = require('../../../middleware/jwtConfig');

// Create or add new product to cart
router.post('/add', verifyToken(['customer']), cartController.createOrUpdateCart);

// View cart
router.get('/view/', verifyToken(['customer']), cartController.getCart);

// Increment or decrement quantity from cart
router.patch('/update/quantity', verifyToken(['customer']), cartController.updateCartQuantity);

// Remove product
router.delete('/remove/product', verifyToken(['customer']), cartController.removeProductFromCart);

// Delete cart
router.delete('/delete/:userId', verifyToken(['customer']), cartController.deleteCart);


module.exports = router;