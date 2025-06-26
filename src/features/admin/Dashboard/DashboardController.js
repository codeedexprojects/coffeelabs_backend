const UserModel = require("../../user/auth/UserModel");
const Category = require("../Category/CategoryModel");
const SubCategory = require("../subCategory/subCategoryModel");

exports.getDashboardCounts = async (req, res) => {
    try {
        // Extract filter parameters
        const { status } = req.query;
        
        // Prepare filter objects
        const userFilter = {};
        const categoryFilter = {};
        const subCategoryFilter = {};
        
        // Apply status filter if provided
        if (status) {
            const isActive = status === 'active';
            userFilter.isActive = isActive;
            categoryFilter.isActive = isActive;
            subCategoryFilter.isActive = isActive;
        }
        
        // Get counts in parallel for better performance
        const [totalUsers, totalCategories, totalSubCategories] = await Promise.all([
            UserModel.countDocuments(userFilter),
            Category.countDocuments(categoryFilter),
            SubCategory.countDocuments(subCategoryFilter)
        ]);
        
        // Get active counts (if no status filter applied)
        let activeCounts = {};
        if (!status) {
            const [activeUsers, activeCategories, activeSubCategories] = await Promise.all([
                UserModel.countDocuments({ isActive: true }),
                Category.countDocuments({ isActive: true }),
                SubCategory.countDocuments({ isActive: true })
            ]);
            
            activeCounts = {
                activeUsers,
                activeCategories,
                activeSubCategories
            };
        }
        
        // Prepare response
        const response = {
            success: true,
            data: {
                totalUsers,
                totalCategories,
                totalSubCategories,
                ...activeCounts
            }
        };
        
        // If status filter was applied, add that info to response
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
        
        // Combine filters
        const combinedFilter = { ...statusFilter, ...dateFilter };
        
        // Get counts and statistics
        const [
            usersCount,
            categoriesCount,
            subCategoriesCount,
            latestUsers,
            latestCategories
        ] = await Promise.all([
            UserModel.countDocuments(combinedFilter),
            Category.countDocuments(combinedFilter),
            SubCategory.countDocuments(combinedFilter),
            UserModel.find(combinedFilter)
                .select('-password -__v -refreshToken')
                .sort({ createdAt: -1 })
                .limit(5),
            Category.find(combinedFilter)
                .sort({ createdAt: -1 })
                .limit(5)
        ]);
        
        // Prepare response
        const response = {
            success: true,
            data: {
                counts: {
                    users: usersCount,
                    categories: categoriesCount,
                    subCategories: subCategoriesCount
                },
                latest: {
                    users: latestUsers,
                    categories: latestCategories
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