const Product = require('./ProductModel');
const Category = require('../Category/CategoryModel');
const SubCategory = require('../subCategory/subCategoryModel');
const fs = require('fs');
const path = require('path');

exports.createProduct = async (req, res) => {
    const { 
        name, 
        category, 
        sub_category, 
        description, 
        top_rated, 
        customer_picks, 
        todays_deal, 
        weight_category,
        is_available,
        variants
    } = req.body;

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'At least one product image is required' });
    }

    try {
        // Validate category and subcategory exist
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const subCategoryExists = await SubCategory.findById(sub_category);
        if (!subCategoryExists) {
            return res.status(400).json({ message: 'Invalid sub category ID' });
        }

        // Parse variants if provided as string
        let parsedVariants = [];
        if (variants) {
            try {
                parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
            } catch (err) {
                return res.status(400).json({ message: 'Invalid variants format' });
            }
        }

        const newProduct = new Product({
            name,
            category,
            sub_category,
            description,
            top_rated: top_rated === 'true' || top_rated === true,
            customer_picks: customer_picks === 'true' || customer_picks === true,
            todays_deal: todays_deal === 'true' || todays_deal === true,
            weight_category,
            images: req.files.map(file => file.filename),
            is_available: is_available !== undefined ? (is_available === 'true' || is_available === true) : true,
            variants: parsedVariants
        });

        await newProduct.save();
        
        // Populate category and subcategory for response
        await newProduct.populate('category sub_category');

        res.status(201).json({
            message: 'Product created successfully',
            product: newProduct
        });
    } catch (err) {
        // Handle duplicate key error
       if (err.code === 11000) {
    return res.status(400).json({
        message: 'Product with this name already exists in this subcategory',
        error: 'Duplicate product name in subcategory'
    });
}
        res.status(500).json({
            message: 'Error creating product',
            error: err.message
        });
    }
};

// Get all products with filtering and pagination
exports.getAllProducts = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            category, 
            sub_category, 
            top_rated, 
            customer_picks, 
            todays_deal, 
            is_available,
            search 
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (category) filter.category = category;
        if (sub_category) filter.sub_category = sub_category;
        if (top_rated !== undefined) filter.top_rated = top_rated === 'true';
        if (customer_picks !== undefined) filter.customer_picks = customer_picks === 'true';
        if (todays_deal !== undefined) filter.todays_deal = todays_deal === 'true';
        if (is_available !== undefined) filter.is_available = is_available === 'true';
        
        // Add text search if provided
        if (search) {
            filter.$text = { $search: search };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const products = await Product.find(filter)
            .populate('category', 'name image')
            .populate('sub_category', 'name')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            message: 'Products retrieved successfully',
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalProducts: total,
                hasNext: skip + products.length < total,
                hasPrev: parseInt(page) > 1
            }
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error retrieving products',
            error: err.message
        });
    }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name image description')
            .populate('sub_category', 'name description');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({
            message: 'Product retrieved successfully',
            product
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error retrieving product',
            error: err.message
        });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const { 
            name, 
            category, 
            sub_category, 
            description, 
            top_rated, 
            customer_picks, 
            todays_deal, 
            weight_category,
            is_available,
            variants
        } = req.body;

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Validate category and subcategory if provided
        if (category) {
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                return res.status(400).json({ message: 'Invalid category ID' });
            }
        }

        if (sub_category) {
            const subCategoryExists = await SubCategory.findById(sub_category);
            if (!subCategoryExists) {
                return res.status(400).json({ message: 'Invalid sub category ID' });
            }
        }

        // Handle image updates
        let updatedImages = product.images;
        if (req.files && req.files.length > 0) {
            // Delete old images
            product.images.forEach(imageName => {
                const imagePath = path.join(__dirname, '../../uploads', imageName);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            });
            updatedImages = req.files.map(file => file.filename);
        }

        // Parse variants if provided
        let parsedVariants = product.variants;
        if (variants) {
            try {
                parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
            } catch (err) {
                return res.status(400).json({ message: 'Invalid variants format' });
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            {
                ...(name && { name }),
                ...(category && { category }),
                ...(sub_category && { sub_category }),
                ...(description !== undefined && { description }),
                ...(top_rated !== undefined && { top_rated: top_rated === 'true' || top_rated === true }),
                ...(customer_picks !== undefined && { customer_picks: customer_picks === 'true' || customer_picks === true }),
                ...(todays_deal !== undefined && { todays_deal: todays_deal === 'true' || todays_deal === true }),
                ...(weight_category && { weight_category }),
                ...(is_available !== undefined && { is_available: is_available === 'true' || is_available === true }),
                images: updatedImages,
                variants: parsedVariants
            },
            { new: true, runValidators: true }
        ).populate('category sub_category');

        res.status(200).json({
            message: 'Product updated successfully',
            product: updatedProduct
        });
    } catch (err) {
       if (err.code === 11000) {
    return res.status(400).json({
        message: 'Product with this name already exists in this subcategory',
        error: 'Duplicate product name in subcategory'
    });
}
        res.status(500).json({
            message: 'Error updating product',
            error: err.message
        });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Delete associated images
        product.images.forEach(imageName => {
            const imagePath = path.join(__dirname, '../../uploads', imageName);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        });

        await Product.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: 'Product deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error deleting product',
            error: err.message
        });
    }
};



// Get featured products (top rated, customer picks, today's deals)
exports.getFeaturedProducts = async (req, res) => {
    try {
        const { type, limit = 10 } = req.query;
        
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
            default:
                filter = {
                    is_available: true,
                    $or: [
                        { top_rated: true },
                        { customer_picks: true },
                        { todays_deal: true }
                    ]
                };
        }

        const products = await Product.find(filter)
            .populate('category', 'name image')
            .populate('sub_category', 'name')
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: 'Featured products retrieved successfully',
            products
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error retrieving featured products',
            error: err.message
        });
    }
};

// Add variant to existing product
exports.addVariant = async (req, res) => {
    try {
        const { variant_type, price, stock, available } = req.body;
        
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.variants.push({
            variant_type,
            price,
            stock,
            available: available !== undefined ? available : true
        });

        await product.save();

        res.status(200).json({
            message: 'Variant added successfully',
            product
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error adding variant',
            error: err.message
        });
    }
};

// Update variant
exports.updateVariant = async (req, res) => {
    try {
        const { productId, variantId } = req.params;
        const { variant_type, price, stock, available } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const variant = product.variants.id(variantId);
        if (!variant) {
            return res.status(404).json({ message: 'Variant not found' });
        }

        if (variant_type !== undefined) variant.variant_type = variant_type;
        if (price !== undefined) variant.price = price;
        if (stock !== undefined) variant.stock = stock;
        if (available !== undefined) variant.available = available;

        await product.save();

        res.status(200).json({
            message: 'Variant updated successfully',
            product
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error updating variant',
            error: err.message
        });
    }
};

// Delete variant
exports.deleteVariant = async (req, res) => {
    try {
        const { productId, variantId } = req.params;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.variants.id(variantId).remove();
        await product.save();

        res.status(200).json({
            message: 'Variant deleted successfully',
            product
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error deleting variant',
            error: err.message
        });
    }
};