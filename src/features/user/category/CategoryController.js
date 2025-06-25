const Category = require('../../admin/Category/CategoryModel');


;

// get all categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ 
            message: 'Error fetching categories', 
            error: err.message 
        });
    }
};

// get active categories only
exports.getActiveCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.status(200).json(categories);
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


// search category by name
exports.searchCategory = async (req, res) => {
    const { name, isActive } = req.query;
    
    try {
        const query = {};
        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const categories = await Category.find(query);
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ 
            message: 'Error searching categories', 
            error: err.message 
        });
    }
};