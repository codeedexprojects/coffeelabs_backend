const UserModel = require("../../user/auth/UserModel");
const Category = require("../Category/CategoryModel");
const Product = require("../Product/ProductModel");
const SubCategory = require("../subCategory/subCategoryModel");

exports.getDashboardCounts = async (req, res) => {
    try {
        // Extract filter parameters
        const { status } = req.query;
        
        // Prepare filter objects
        const userFilter = {};
        const categoryFilter = {};
        const subCategoryFilter = {};
        const productFilter = {};
        
        // Apply status filter if provided
        if (status) {
            const isActive = status === 'active';
            userFilter.isActive = isActive;
            categoryFilter.isActive = isActive;
            subCategoryFilter.isActive = isActive;
            // For products, we'll use is_available instead of isActive
            productFilter.is_available = isActive;
        }
        
        // Get counts in parallel for better performance
        const [
            totalUsers, 
            totalCategories, 
            totalSubCategories,
            totalProducts,
            topRatedProducts,
            availableProducts,
            customerPicksProducts,
            todaysDealsProducts,
            lowStockProducts
        ] = await Promise.all([
            UserModel.countDocuments(userFilter),
            Category.countDocuments(categoryFilter),
            SubCategory.countDocuments(subCategoryFilter),
            Product.countDocuments(productFilter),
            Product.countDocuments({ ...productFilter, top_rated: true }),
            Product.countDocuments({ is_available: true }),
            Product.countDocuments({ ...productFilter, customer_picks: true }),
            Product.countDocuments({ ...productFilter, todays_deal: true }),
            // Low stock: products with total stock (sum of all variants) <= 10
            Product.aggregate([
                {
                    $addFields: {
                        totalStock: {
                            $sum: "$variants.stock"
                        }
                    }
                },
                {
                    $match: {
                        totalStock: { $lte: 10, $gte: 0 }
                    }
                },
                {
                    $count: "lowStockCount"
                }
            ]).then(result => result[0]?.lowStockCount || 0)
        ]);
        
        // Get active counts (if no status filter applied)
        let activeCounts = {};
        if (!status) {
            const [
                activeUsers, 
                activeCategories, 
                activeSubCategories,
                activeProducts
            ] = await Promise.all([
                UserModel.countDocuments({ isActive: true }),
                Category.countDocuments({ isActive: true }),
                SubCategory.countDocuments({ isActive: true }),
                Product.countDocuments({ is_available: true })
            ]);
            
            activeCounts = {
                activeUsers,
                activeCategories,
                activeSubCategories,
                activeProducts
            };
        }
        
        // Prepare response
        const response = {
            success: true,
            data: {
                totalUsers,
                totalCategories,
                totalSubCategories,
                totalProducts,
                topRatedProducts,
                availableProducts,
                customerPicksProducts,
                todaysDealsProducts,
                lowStockProducts,
                ...activeCounts
            }
        };
        
        if (status) {
            response.filter = {
                status
            };
        }
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Dashboard Counts Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard counts',
            error: error.message
        });
    }
};

// Extended version with more detailed statistics
exports.getDashboardStatistics = async (req, res) => {
    try {
        // Extract filter parameters
        const { status, timeRange } = req.query;
        
        // Prepare date filter if timeRange is provided
        let dateFilter = {};
        if (timeRange) {
            const now = new Date();
            let startDate;
            
            switch(timeRange) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case 'year':
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
                default:
                    // Custom range in format 'YYYY-MM-DD,YYYY-MM-DD'
                    const [start, end] = timeRange.split(',');
                    if (start && end) {
                        dateFilter = {
                            createdAt: {
                                $gte: new Date(start),
                                $lte: new Date(end)
                            }
                        };
                    }
            }
            
            if (startDate && !dateFilter.createdAt) {
                dateFilter.createdAt = { $gte: startDate };
            }
        }
        
        // Prepare status filter
        const statusFilter = status ? { isActive: status === 'active' } : {};
        const productStatusFilter = status ? { is_available: status === 'active' } : {};
        
        // Combine filters
        const combinedFilter = { ...statusFilter, ...dateFilter };
        const productCombinedFilter = { ...productStatusFilter, ...dateFilter };
        
        // Get counts and statistics
        const [
            usersCount,
            categoriesCount,
            subCategoriesCount,
            productsCount,
            topRatedCount,
            customerPicksCount,
            todaysDealsCount,
            availableProductsCount,
            lowStockCount,
            latestUsers,
            latestCategories,
            latestProducts,
            lowStockProducts
        ] = await Promise.all([
            UserModel.countDocuments(combinedFilter),
            Category.countDocuments(combinedFilter),
            SubCategory.countDocuments(combinedFilter),
            Product.countDocuments(productCombinedFilter),
            Product.countDocuments({ ...productCombinedFilter, top_rated: true }),
            Product.countDocuments({ ...productCombinedFilter, customer_picks: true }),
            Product.countDocuments({ ...productCombinedFilter, todays_deal: true }),
            Product.countDocuments({ ...productCombinedFilter, is_available: true }),
            Product.aggregate([
                {
                    $addFields: {
                        totalStock: {
                            $sum: "$variants.stock"
                        }
                    }
                },
                {
                    $match: {
                        totalStock: { $lte: 10, $gte: 0 }
                    }
                },
                {
                    $count: "lowStockCount"
                }
            ]).then(result => result[0]?.lowStockCount || 0),
            UserModel.find(combinedFilter)
                .select('-password -__v -refreshToken')
                .sort({ createdAt: -1 })
                .limit(5),
            Category.find(combinedFilter)
                .sort({ createdAt: -1 })
                .limit(5),
            Product.find(productCombinedFilter)
                .populate('category', 'name')
                .populate('sub_category', 'name')
                .sort({ createdAt: -1 })
                .limit(5),
            Product.find({
                $or: [
                    { "variants.stock": { $lte: 5, $gt: 0 } },
                    { "variants": { $size: 0 } }
                ]
            })
                .populate('category', 'name')
                .populate('sub_category', 'name')
                .limit(10)
        ]);
        
        // Prepare response
        const response = {
            success: true,
            data: {
                counts: {
                    users: usersCount,
                    categories: categoriesCount,
                    subCategories: subCategoriesCount,
                    products: productsCount,
                    topRated: topRatedCount,
                    customerPicks: customerPicksCount,
                    todaysDeals: todaysDealsCount,
                    availableProducts: availableProductsCount,
                    lowStock: lowStockCount
                },
                latest: {
                    users: latestUsers,
                    categories: latestCategories,
                    products: latestProducts
                },
                alerts: {
                    lowStockProducts: lowStockProducts
                }
            }
        };
        
        // Add filter info to response if any filter was applied
        const appliedFilters = {};
        if (status) appliedFilters.status = status;
        if (timeRange) appliedFilters.timeRange = timeRange;
        
        if (Object.keys(appliedFilters).length > 0) {
            response.filters = appliedFilters;
        }
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Dashboard Statistics Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    }
};

// Additional function to get product-specific dashboard data
exports.getProductDashboard = async (req, res) => {
    try {
        const { category, sub_category } = req.query;
        
        // Build filter for category/subcategory if provided
        const filter = {};
        if (category) filter.category = category;
        if (sub_category) filter.sub_category = sub_category;
        
        // Get comprehensive product statistics
        const [
            totalProducts,
            availableProducts,
            unavailableProducts,
            topRatedProducts,
            customerPicksProducts,
            todaysDealsProducts,
            productsWithVariants,
            productsWithoutVariants,
            lowStockProducts,
            outOfStockProducts,
            categoryBreakdown,
            recentProducts
        ] = await Promise.all([
            Product.countDocuments(filter),
            Product.countDocuments({ ...filter, is_available: true }),
            Product.countDocuments({ ...filter, is_available: false }),
            Product.countDocuments({ ...filter, top_rated: true }),
            Product.countDocuments({ ...filter, customer_picks: true }),
            Product.countDocuments({ ...filter, todays_deal: true }),
            Product.countDocuments({ ...filter, "variants.0": { $exists: true } }),
            Product.countDocuments({ ...filter, variants: { $size: 0 } }),
            Product.countDocuments({
                ...filter,
                $or: [
                    { "variants.stock": { $lte: 5, $gt: 0 } }
                ]
            }),
            Product.countDocuments({
                ...filter,
                $or: [
                    { "variants.stock": 0 },
                    { variants: { $size: 0 }, is_available: false }
                ]
            }),
            // Get product count by category
            Product.aggregate([
                { $match: filter },
                { $group: { _id: "$category", count: { $sum: 1 } } },
                { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
                { $unwind: "$category" },
                { $project: { categoryName: "$category.name", count: 1 } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            Product.find(filter)
                .populate('category', 'name')
                .populate('sub_category', 'name')
                .sort({ createdAt: -1 })
                .limit(10)
        ]);
        
        const response = {
            success: true,
            data: {
                overview: {
                    totalProducts,
                    availableProducts,
                    unavailableProducts,
                    topRatedProducts,
                    customerPicksProducts,
                    todaysDealsProducts
                },
                inventory: {
                    productsWithVariants,
                    productsWithoutVariants,
                    lowStockProducts,
                    outOfStockProducts
                },
                categoryBreakdown,
                recentProducts
            }
        };
        
        // Add filter info if applied
        if (category || sub_category) {
            response.filters = { category, sub_category };
        }
        
        res.status(200).json(response);
        
    } catch (error) {
        console.error('Product Dashboard Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching product dashboard data',
            error: error.message
        });
    }
};