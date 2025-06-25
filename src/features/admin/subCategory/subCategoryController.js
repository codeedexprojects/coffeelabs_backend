const SubCategory = require('./subCategoryModel');
const Category = require('../Category/CategoryModel');
const fs = require('fs');
const path = require('path');

// create a new subcategory
exports.createSubCategory = async (req, res) => {
    const { name, category_id, description, isActive } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Subcategory image is required' });
    }

    try {
        // Check if category exists
        const categoryExists = await Category.findById(category_id);
        if (!categoryExists) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        const newSubCategory = new SubCategory({
            name: name,
            category_id: category_id,
            image: req.file.filename,
            description: description,
            isActive: isActive !== undefined ? isActive : true
        });
        
        await newSubCategory.save();
        
        // Populate category details
        await newSubCategory.populate('category_id', 'name');
        
        res.status(201).json({ 
            message: 'Subcategory created successfully', 
            subcategory: newSubCategory 
        });
    } catch (err) {
        // Handle duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({ 
                message: 'Subcategory name already exists', 
                error: 'Duplicate subcategory name' 
            });
        }
        res.status(500).json({ 
            message: 'Error creating subcategory', 
            error: err.message 
        });
    }
};

// get all subcategories
exports.getSubCategories = async (req, res) => {
    try {
        const subcategories = await SubCategory.find().populate('category_id', 'name isActive');
        res.status(200).json(subcategories);
    } catch (err) {
        res.status(500).json({ 
            message: 'Error fetching subcategories', 
            error: err.message 
        });
    }
};

// get active subcategories only
exports.getActiveSubCategories = async (req, res) => {
    try {
        const subcategories = await SubCategory.find({ isActive: true })
            .populate('category_id', 'name isActive');
        res.status(200).json(subcategories);
    } catch (err) {
        res.status(500).json({ 
            message: 'Error fetching active subcategories', 
            error: err.message 
        });
    }
};

// get subcategories by category ID
exports.getSubCategoriesByCategory = async (req, res) => {
    const { categoryId } = req.params;
    
    try {
        const subcategories = await SubCategory.find({ category_id: categoryId })
            .populate('category_id', 'name isActive');
        res.status(200).json(subcategories);
    } catch (err) {
        res.status(500).json({ 
            message: 'Error fetching subcategories', 
            error: err.message 
        });
    }
};

// get a subcategory by Id
exports.getSubCategoryById = async (req, res) => {
    const { id } = req.params;

    try {
        const subcategory = await SubCategory.findById(id).populate('category_id', 'name isActive');
        if (!subcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }
        res.status(200).json(subcategory);
    } catch (err) {
        res.status(500).json({ 
            message: 'Error fetching subcategory', 
            error: err.message 
        });
    }
};

// update subcategory
exports.updateSubCategory = async (req, res) => {
    const { id } = req.params;
    const { name, category_id, description, isActive } = req.body;

    try {
        const subcategory = await SubCategory.findById(id);
        if (!subcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }

        // Check if new category exists (if category_id is being updated)
        if (category_id && category_id !== subcategory.category_id.toString()) {
            const categoryExists = await Category.findById(category_id);
            if (!categoryExists) {
                return res.status(400).json({ message: 'Invalid category ID' });
            }
            subcategory.category_id = category_id;
        }

        // Update fields if provided
        if (name) subcategory.name = name;
        if (description !== undefined) subcategory.description = description;
        if (isActive !== undefined) subcategory.isActive = isActive;

        // Update image if a new image is uploaded
        if (req.file) {
            const oldImagePath = path.join(__dirname, `../uploads/admin/subcategory/${subcategory.image}`);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            subcategory.image = req.file.filename;
        }

        await subcategory.save();
        await subcategory.populate('category_id', 'name isActive');
        
        res.status(200).json({ 
            message: 'Subcategory updated successfully', 
            subcategory 
        });
    } catch (err) {
        // Handle duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({ 
                message: 'Subcategory name already exists', 
                error: 'Duplicate subcategory name' 
            });
        }
        res.status(500).json({ 
            message: 'Error updating subcategory', 
            error: err.message 
        });
    }
};

// delete subcategory
exports.deleteSubCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const subcategory = await SubCategory.findById(id);
        if (!subcategory) {
            return res.status(404).json({ message: 'Subcategory not found' });
        }

        const imagePath = `./uploads/subcategory/${subcategory.image}`;
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await SubCategory.findByIdAndDelete(id);
        res.status(200).json({ message: 'Subcategory deleted successfully' });
    } catch (err) {
        res.status(500).json({ 
            message: 'Error deleting subcategory', 
            error: err.message 
        });
    }
};

// search subcategory
exports.searchSubCategory = async (req, res) => {
    const { name, category_id, isActive } = req.query;
    
    try {
        const query = {};
        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        if (category_id) {
            query.category_id = category_id;
        }
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const subcategories = await SubCategory.find(query).populate('category_id', 'name isActive');
        res.status(200).json(subcategories);
    } catch (err) {
        res.status(500).json({ 
            message: 'Error searching subcategories', 
            error: err.message 
        });
    }
};
