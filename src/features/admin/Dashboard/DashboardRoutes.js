const express = require('express');
const verifyAdminToken = require('../../../middleware/jwtConfig');
const router = express.Router();
const DashboardController = require('./DashboardController');

// Route for basic dashboard counts
router.get('/counts', verifyAdminToken(['admin']), DashboardController.getDashboardCounts);

// Route for detailed dashboard statistics  
router.get('/statistics', verifyAdminToken(['admin']), DashboardController.getDashboardStatistics);

router.get('/product/counts',verifyAdminToken(['admin']), DashboardController.getProductDashboard)

module.exports = router;