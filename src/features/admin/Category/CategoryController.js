const Category = require('./CategoryModel');
const fs = require('fs');
const path = require('path');

// create a new category
exports.createCategory = async (req, res) => {
    const { name, description, isActive } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Category image is required' });
    }

    try {
        const newCategory = new Category({
            name: name,
            image: req.file.filename,
            description: description,
            isActive: isActive !== undefined ? isActive : true
        });
        
        await newCategory.save();
        res.status(201).json({ 
            message: 'Category created successfully', 
            category: newCategory 
        });
    } catch (err) {
        // Handle duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({ 
                message: 'Category name already exists', 
                error: 'Duplicate category name' 
            });
        }
        res.status(500).json({ 
            message: 'Error creating category', 
            error: err.message 
        });
    }
};

// get all categories with pagination
exports.getCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Category.countDocuments();
        const categories = await Category.find()
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            totalItems: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            categories
        });
    } catch (err) {
        res.status(500).json({ 
            message: 'Error fetching categories', 
            error: err.message 
        });
    }
};

// get active categories only with pagination
exports.getActiveCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Category.countDocuments({ isActive: true });
        const categories = await Category.find({ isActive: true })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            totalItems: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            categories
        });
    } catch (err) {
        res.status(500).json({ 
            message: 'Error fetching active categories', 
            error: err.message 
        });
    }
};

// get a category by Id
exports.getCategoryById = async (req, res) => {
    const { id } = req.params;

    try {
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json(category);
    } catch (err) {
        res.status(500).json({ 
            message: 'Error fetching category', 
            error: err.message 
        });
    }
};

// update category
exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    try {
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Update fields if provided
        if (name) category.name = name;
        if (description !== undefined) category.description = description;
        if (isActive !== undefined) category.isActive = isActive;

        // Update image if a new image is uploaded
        if (req.file) {
            const oldImagePath = path.join(__dirname, `../uploads/admin/category/${category.image}`);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            category.image = req.file.filename;
        }

        await category.save();
        res.status(200).json({ 
            message: 'Category updated successfully', 
            category 
        });
    } catch (err) {
        // Handle duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({ 
                message: 'Category name already exists', 
                error: 'Duplicate category name' 
            });
        }
        res.status(500).json({ 
            message: 'Error updating category', 
            error: err.message 
        });
    }
};

// delete category
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const imagePath = path.join(__dirname, `../uploads/admin/category/${category.image}`);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await Category.findByIdAndDelete(id);
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ 
            message: 'Error deleting category', 
            error: err.message 
        });
    }
};

// search category by name with pagination
exports.searchCategory = async (req, res) => {
    const { name, isActive } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    try {
        const query = {};
        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const total = await Category.countDocuments(query);
        const categories = await Category.find(query)
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            totalItems: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            categories
        });
    } catch (err) {
        res.status(500).json({ 
            message: 'Error searching categories', 
            error: err.message 
        });
    }
};