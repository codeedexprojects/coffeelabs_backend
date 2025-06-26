const express = require('express');
const router = express.Router();
const UserProductController = require('./ProductController');

// Get all products with filtering (public route - no auth needed)
router.get('/', UserProductController.getAllProducts);

// Get product by ID (public route - no auth needed) 
router.get('/:id', UserProductController.getProductById);

// Get products by category
router.get('/category/:categoryId', UserProductController.getProductsByCategory);

// Get products by subcategory
router.get('/subcategory/:subCategoryId', UserProductController.getProductsBySubCategory);

// Get products by weight category
router.get('/weight/:weightCategory', UserProductController.getProductsByWeightCategory);

// Get featured products (top rated, customer picks, today's deals)
router.get('/featured/:type', UserProductController.getFeaturedProducts);

// Search products
router.get('/search/:query', UserProductController.searchProducts);

module.exports = router;