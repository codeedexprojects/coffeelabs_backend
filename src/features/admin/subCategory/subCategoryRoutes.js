const express = require('express');
const router = express.Router();
const subCategoryController = require('./subCategoryController');
const verifyToken = require('../../../middleware/jwtConfig');
const multerConfig = require('../../../middleware/multerConfig');

// create subcategory
router.post('/create', verifyToken(['admin']), multerConfig.single('image'), subCategoryController.createSubCategory);

// get all subcategories
router.get('/view', verifyToken(['admin']), subCategoryController.getSubCategories);

// get active subcategories only
router.get('/active', verifyToken(['admin']), subCategoryController.getActiveSubCategories);

// get subcategories by category
router.get('/category/:categoryId', verifyToken(['admin']), subCategoryController.getSubCategoriesByCategory);

// view by id
router.get('/view/:id', verifyToken(['admin']), subCategoryController.getSubCategoryById);

// update subcategory
router.patch('/update/:id', verifyToken(['admin']), multerConfig.single('image'), subCategoryController.updateSubCategory);

// delete subcategory
router.delete('/delete/:id', verifyToken(['admin']), subCategoryController.deleteSubCategory);

// search subcategories
router.get('/search', verifyToken(['admin']), subCategoryController.searchSubCategory);

module.exports = router;