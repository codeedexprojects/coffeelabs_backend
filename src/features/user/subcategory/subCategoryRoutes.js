const express = require('express');
const router = express.Router();
const subCategoryController = require('./subcategoryController');


// get all subcategories
router.get('/view', subCategoryController.getSubCategories);

// get active subcategories only
router.get('/active', subCategoryController.getActiveSubCategories);

// get subcategories by category
router.get('/category/:categoryId', subCategoryController.getSubCategoriesByCategory);

// view by id
router.get('/view/:id', subCategoryController.getSubCategoryById);

// search subcategories
router.get('/search', subCategoryController.searchSubCategory);

module.exports = router;