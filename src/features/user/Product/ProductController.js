const Product = require('../../admin/Product/ProductModel');
const Category = require('../../admin/Category/CategoryModel');
const SubCategory = require('../../admin/subCategory/subCategoryModel');

// Get all products with filtering and pagination (User side)
exports.getAllProducts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 12, 
            category, 
            sub_category, 
            weight_category,
            top_rated, 
            customer_picks, 
            todays_deal,
            price_min,
            price_max,
            sort = 'newest',
            search 
        } = req.query;

        // Build filter object - only show available products
        const filter = { is_available: true };
        
        if (category) filter.category = category;
        if (sub_category) filter.sub_category = sub_category;
        if (weight_category) filter.weight_category = weight_category;
        if (top_rated === 'true') filter.top_rated = true;
        if (customer_picks === 'true') filter.customer_picks = true;
        if (todays_deal === 'true') filter.todays_deal = true;
        
        // Add text search if provided
        if (search) {
            filter.$text = { $search: search };
        }

        // Build aggregation pipeline for price filtering
        let pipeline = [
            { $match: filter },
            {
                $addFields: {
                    minPrice: {
                        $min: {
                            $map: {
                                input: { $filter: { input: "$variants", cond: { $eq: ["$$this.available", true] } } },
                                in: "$$this.price"
                            }
                        }
                    },
                    maxPrice: {
                        $max: {
                            $map: {
                                input: { $filter: { input: "$variants", cond: { $eq: ["$$this.available", true] } } },
                                in: "$$this.price"
                            }
                        }
                    }
                }
            }
        ];

        // Add price range filtering
        if (price_min || price_max) {
            const priceFilter = {};
            if (price_min) priceFilter.$gte = parseFloat(price_min);
            if (price_max) priceFilter.$lte = parseFloat(price_max);
            pipeline.push({ $match: { minPrice: priceFilter } });
        }

        // Add sorting
        let sortOptions = {};
        switch (sort) {
            case 'price_low':
                sortOptions = { minPrice: 1 };
                break;
            case 'price_high':
                sortOptions = { minPrice: -1 };
                break;
            case 'name_asc':
                sortOptions = { name: 1 };
                break;
            case 'name_desc':
                sortOptions = { name: -1 };
                break;
            case 'oldest':
                sortOptions = { createdAt: 1 };
                break;
            default: // newest
                sortOptions = { createdAt: -1 };
        }
        pipeline.push({ $sort: sortOptions });

        // Add pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });

        // Add population
        pipeline.push(
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $lookup: {
                    from: 'subcategories',
                    localField: 'sub_category',
                    foreignField: '_id',
                    as: 'sub_category'
                }
            },
            {
                $addFields: {
                    category: { $arrayElemAt: ['$category', 0] },
                    sub_category: { $arrayElemAt: ['$sub_category', 0] }
                }
            }
        );

        const products = await Product.aggregate(pipeline);

        // Get total count for pagination
        const totalPipeline = [
            { $match: filter },
            {
                $addFields: {
                    minPrice: {
                        $min: {
                            $map: {
                                input: { $filter: { input: "$variants", cond: { $eq: ["$$this.available", true] } } },
                                in: "$$this.price"
                            }
                        }
                    }
                }
            }
        ];

        if (price_min || price_max) {
            const priceFilter = {};
            if (price_min) priceFilter.$gte = parseFloat(price_min);
            if (price_max) priceFilter.$lte = parseFloat(price_max);
            totalPipeline.push({ $match: { minPrice: priceFilter } });
        }

        totalPipeline.push({ $count: "total" });
        const totalResult = await Product.aggregate(totalPipeline);
        const total = totalResult.length > 0 ? totalResult[0].total : 0;

        res.status(200).json({
            success: true,
            message: 'Products retrieved successfully',
            data: {
                products,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalProducts: total,
                    hasNext: skip + products.length < total,
                    hasPrev: parseInt(page) > 1,
                    limit: parseInt(limit)
                },
                filters: {
                    category,
                    sub_category,
                    weight_category,
                    price_min,
                    price_max,
                    sort,
                    search
                }
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving products',
            error: err.message
        });
    }
};

// Get single product by ID (User side)
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findOne({ 
            _id: req.params.id, 
            is_available: true 
        })
        .populate('category', 'name image description')
        .populate('sub_category', 'name description');

        if (!product) {
            return res.status(404).json({ 
                success: false,
                message: 'Product not found or not available' 
            });
        }

        // Only return available variants
        const productObj = product.toObject();
        productObj.variants = productObj.variants.filter(variant => variant.available);

        res.status(200).json({
            success: true,
            message: 'Product retrieved successfully',
            data: productObj
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving product',
            error: err.message
        });
    }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { 
            page = 1, 
            limit = 12, 
            sub_category,
            weight_category,
            price_min,
            price_max,
            sort = 'newest'
        } = req.query;

        // Verify category exists
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const filter = { 
            category: categoryId, 
            is_available: true 
        };

        if (sub_category) filter.sub_category = sub_category;
        if (weight_category) filter.weight_category = weight_category;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        let sortOptions = {};
        switch (sort) {
            case 'price_low':
                sortOptions = { 'variants.price': 1 };
                break;
            case 'price_high':
                sortOptions = { 'variants.price': -1 };
                break;
            case 'name_asc':
                sortOptions = { name: 1 };
                break;
            case 'name_desc':
                sortOptions = { name: -1 };
                break;
            default:
                sortOptions = { createdAt: -1 };
        }

        const products = await Product.find(filter)
            .populate('category', 'name image description')
            .populate('sub_category', 'name description')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Products retrieved successfully',
            data: {
                products,
                category,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalProducts: total,
                    hasNext: skip + products.length < total,
                    hasPrev: parseInt(page) > 1
                }
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving products by category',
            error: err.message
        });
    }
};

// Get products by subcategory
exports.getProductsBySubCategory = async (req, res) => {
    try {
        const { subCategoryId } = req.params;
        const { 
            page = 1, 
            limit = 12, 
            weight_category,
            price_min,
            price_max,
            sort = 'newest'
        } = req.query;

        // Verify subcategory exists
        const subCategory = await SubCategory.findById(subCategoryId);
        if (!subCategory) {
            return res.status(404).json({
                success: false,
                message: 'Subcategory not found'
            });
        }

        const filter = { 
            sub_category: subCategoryId, 
            is_available: true 
        };

        if (weight_category) filter.weight_category = weight_category;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        let sortOptions = {};
        switch (sort) {
            case 'price_low':
                sortOptions = { 'variants.price': 1 };
                break;
            case 'price_high':
                sortOptions = { 'variants.price': -1 };
                break;
            case 'name_asc':
                sortOptions = { name: 1 };
                break;
            case 'name_desc':
                sortOptions = { name: -1 };
                break;
            default:
                sortOptions = { createdAt: -1 };
        }

        const products = await Product.find(filter)
            .populate('category', 'name image description')
            .populate('sub_category', 'name description')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Products retrieved successfully',
            data: {
                products,
                subCategory,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalProducts: total,
                    hasNext: skip + products.length < total,
                    hasPrev: parseInt(page) > 1
                }
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving products by subcategory',
            error: err.message
        });
    }
};

// Get products by weight category
exports.getProductsByWeightCategory = async (req, res) => {
    try {
        const { weightCategory } = req.params;
        const { 
            page = 1, 
            limit = 12, 
            category,
            sub_category,
            price_min,
            price_max,
            sort = 'newest'
        } = req.query;

        const validWeightCategories = ['kg', 'gm', 'litre', 'ml', 'pieces'];
        if (!validWeightCategories.includes(weightCategory.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: `Invalid weight category. Valid options: ${validWeightCategories.join(', ')}`
            });
        }

        const filter = { 
            weight_category: weightCategory.toLowerCase(), 
            is_available: true 
        };

        if (category) filter.category = category;
        if (sub_category) filter.sub_category = sub_category;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        let sortOptions = {};
        switch (sort) {
            case 'price_low':
                sortOptions = { 'variants.price': 1 };
                break;
            case 'price_high':
                sortOptions = { 'variants.price': -1 };
                break;
            case 'name_asc':
                sortOptions = { name: 1 };
                break;
            case 'name_desc':
                sortOptions = { name: -1 };
                break;
            default:
                sortOptions = { createdAt: -1 };
        }

        const products = await Product.find(filter)
            .populate('category', 'name image description')
            .populate('sub_category', 'name description')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Products retrieved successfully',
            data: {
                products,
                weightCategory,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalProducts: total,
                    hasNext: skip + products.length < total,
                    hasPrev: parseInt(page) > 1
                }
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving products by weight category',
            error: err.message
        });
    }
};

// Get featured products (top rated, customer picks, today's deals)
exports.getFeaturedProducts = async (req, res) => {
    try {
        const { type } = req.params;
        const { limit = 10 } = req.query;
        
        const validTypes = ['top_rated', 'customer_picks', 'todays_deal', 'all'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid type. Valid options: ${validTypes.join(', ')}`
            });
        }

        let filter = { is_available: true };
        
        switch (type) {
            case 'top_rated':
                filter.top_rated = true;
                break;
            case 'customer_picks':
                filter.customer_picks = true;
                break;
            case 'todays_deal':
                filter.todays_deal = true;
                break;
            case 'all':
                filter.$or = [
                    { top_rated: true },
                    { customer_picks: true },
                    { todays_deal: true }
                ];
                break;
        }

        const products = await Product.find(filter)
            .populate('category', 'name image')
            .populate('sub_category', 'name')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: `${type.replace('_', ' ')} products retrieved successfully`,
            data: {
                products,
                type,
                count: products.length
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving featured products',
            error: err.message
        });
    }
};

// Search products
exports.searchProducts = async (req, res) => {
    try {
        const { query } = req.params;
        const { 
            page = 1, 
            limit = 12, 
            category,
            sub_category,
            weight_category,
            price_min,
            price_max,
            sort = 'relevance'
        } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const filter = { 
            $text: { $search: query },
            is_available: true 
        };

        if (category) filter.category = category;
        if (sub_category) filter.sub_category = sub_category;
        if (weight_category) filter.weight_category = weight_category;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        let sortOptions = {};
        switch (sort) {
            case 'price_low':
                sortOptions = { 'variants.price': 1 };
                break;
            case 'price_high':
                sortOptions = { 'variants.price': -1 };
                break;
            case 'name_asc':
                sortOptions = { name: 1 };
                break;
            case 'name_desc':
                sortOptions = { name: -1 };
                break;
            case 'newest':
                sortOptions = { createdAt: -1 };
                break;
            default: // relevance
                sortOptions = { score: { $meta: 'textScore' } };
        }

        const products = await Product.find(filter, { score: { $meta: 'textScore' } })
            .populate('category', 'name image')
            .populate('sub_category', 'name')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Search results retrieved successfully',
            data: {
                products,
                searchQuery: query,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalProducts: total,
                    hasNext: skip + products.length < total,
                    hasPrev: parseInt(page) > 1
                }
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error searching products',
            error: err.message
        });
    }
};


// New controller for boolean flag filtering
exports.filterByFlags = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 12,
            top_rated,
            customer_picks,
            todays_deal,
            sort = 'newest'
        } = req.query;

        // Build filter object
        const filter = { is_available: true };
        
        // Add boolean flag filters
        if (top_rated !== undefined) {
            filter.top_rated = top_rated === 'true';
        }
        if (customer_picks !== undefined) {
            filter.customer_picks = customer_picks === 'true';
        }
        if (todays_deal !== undefined) {
            filter.todays_deal = todays_deal === 'true';
        }

        // Validate at least one filter is provided
        if (!top_rated && !customer_picks && !todays_deal) {
            return res.status(400).json({
                success: false,
                message: 'At least one filter (top_rated, customer_picks, or todays_deal) must be provided'
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Sorting options
        let sortOptions = {};
        switch (sort) {
            case 'price_low':
                sortOptions = { 'variants.price': 1 };
                break;
            case 'price_high':
                sortOptions = { 'variants.price': -1 };
                break;
            case 'name_asc':
                sortOptions = { name: 1 };
                break;
            case 'name_desc':
                sortOptions = { name: -1 };
                break;
            default: // newest
                sortOptions = { createdAt: -1 };
        }

        // Execute query
        const products = await Product.find(filter)
            .populate('category', 'name image')
            .populate('sub_category', 'name')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Products filtered successfully',
            data: {
                products,
                filters: {
                    top_rated,
                    customer_picks,
                    todays_deal,
                    sort
                },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalProducts: total,
                    hasNext: skip + products.length < total,
                    hasPrev: parseInt(page) > 1
                }
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error filtering products',
            error: err.message
        });
    }
};