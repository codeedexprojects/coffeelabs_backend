const express = require('express');
const router = express.Router();
const Productcontroller = require('./ProductController');
const verifyToken = require('../../../middleware/jwtConfig');
const multerConfig = require('../../../middleware/multerConfig');

// create product
router.post('/create', verifyToken(['admin']), multerConfig.array('images'), Productcontroller.createProduct);


// get all product
router.get('/view', verifyToken(['admin']), Productcontroller.getAllProducts);


// view by id
router.get('/view/:id', verifyToken(['admin']), Productcontroller.getProductById);

// update product
router.patch('/update/:id', verifyToken(['admin']), multerConfig.array('images'), Productcontroller.updateProduct);

// delete product
router.delete('/delete/:id', verifyToken(['admin']), Productcontroller.deleteProduct);


module.exports = router;