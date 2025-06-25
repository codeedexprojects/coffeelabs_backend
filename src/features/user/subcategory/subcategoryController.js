const SubCategory = require('../../admin/subCategory/subCategoryModel');



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
