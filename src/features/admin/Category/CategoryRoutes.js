const express = require('express');
const router = express.Router();
const categoryController = require('./CategoryController');
const verifyToken = require('../../../middleware/jwtConfig');
const multerConfig = require('../../../middleware/multerConfig');

// create category
router.post('/create', verifyToken(['admin']), multerConfig.single('image'), categoryController.createCategory);

// get all categories
router.get('/view', verifyToken(['admin']), categoryController.getCategories);

// get active categories only
router.get('/active', verifyToken(['admin']), categoryController.getActiveCategories);

// view by id
router.get('/view/:id', verifyToken(['admin']), categoryController.getCategoryById);

// update category
router.patch('/update/:id', verifyToken(['admin']), multerConfig.single('image'), categoryController.updateCategory);

// delete category
router.delete('/delete/:id', verifyToken(['admin']), categoryController.deleteCategory);

// search categories
router.get('/search', verifyToken(['admin']), categoryController.searchCategory);

module.exports = router;