const mongoose = require('mongoose');

// Variant Schema (embedded in Product)
const variantSchema = new mongoose.Schema({
    variant_type: {
        type: String,
        required: [true, "Variant type is required"],
        trim: true
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price cannot be negative"]
    },
    stock: {
        type: Number,
        required: [true, "Stock is required"],
        min: [0, "Stock cannot be negative"],
        default: 0
    },
    available: {
        type: Boolean,
        default: true
    }
}, { _id: true });

// Product Schema
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
        index: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, "Category is required"],
        index: true
    },
    sub_category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory', 
        required: [true, "Sub category is required"],
        index: true
    },
    description: {
        type: String,
        trim: true
    },
    top_rated: {
        type: Boolean,
        default: false,
        index: true
    },
    customer_picks: {
        type: Boolean,
        default: false,
        index: true
    },
    todays_deal: {
        type: Boolean,
        default: false,
        index: true
    },
    weight_category: {
        type: String,
        required: [true, "Weight category is required"],
        enum: ['kg', 'gm', 'litre', 'ml', 'pieces'],
        lowercase: true
    },
    images: [{
        type: String,
        required: true
    }],
    is_available: {
        type: Boolean,
        default: true,
        index: true
    },
    variants: [variantSchema]
}, { 
    timestamps: true 
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, sub_category: 1 });
productSchema.index({ top_rated: 1, customer_picks: 1, todays_deal: 1 });
productSchema.index({ name: 1, sub_category: 1 }, { unique: true });

// Virtual for getting available variants
productSchema.virtual('availableVariants').get(function() {
    return this.variants.filter(variant => variant.available && variant.stock > 0);
});

// Method to check if product has stock
productSchema.methods.hasStock = function() {
    return this.variants.some(variant => variant.available && variant.stock > 0);
};

// Method to get lowest price variant
productSchema.methods.getLowestPrice = function() {
    const availableVariants = this.variants.filter(variant => variant.available);
    if (availableVariants.length === 0) return null;
    return Math.min(...availableVariants.map(variant => variant.price));
};

// Method to get highest price variant
productSchema.methods.getHighestPrice = function() {
    const availableVariants = this.variants.filter(variant => variant.available);
    if (availableVariants.length === 0) return null;
    return Math.max(...availableVariants.map(variant => variant.price));
};

// Pre-save middleware to update is_available based on variants
productSchema.pre('save', function(next) {
    if (this.variants && this.variants.length > 0) {
        this.is_available = this.hasStock();
    }
    next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;