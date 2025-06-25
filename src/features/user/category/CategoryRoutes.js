const express = require('express');
const router = express.Router();
const categoryController = require('./CategoryController');


// get all categories
router.get('/view', categoryController.getCategories);

// get active categories only
router.get('/active', categoryController.getActiveCategories);

// view by id
router.get('/view/:id', categoryController.getCategoryById);

// search categories
router.get('/search', categoryController.searchCategory);

module.exports = router;