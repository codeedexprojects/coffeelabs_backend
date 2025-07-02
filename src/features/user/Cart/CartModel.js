const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, "Product ID is required"]
    },
    variant_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Variant ID is required"]
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [1, "Quantity must be at least 1"],
        default: 1
    },
    variant_details: {
        variant_type: String,
        price: Number,
        stock: Number,
        available: Boolean
    },
    subtotal: {
        type: Number,
        required: true,
        min: [0, "Subtotal cannot be negative"]
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    _id: true 
});

// Cart Schema
const cartSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "User ID is required"],
        index: true
    },
    items: [cartItemSchema],
    total_quantity: {
        type: Number,
        default: 0,
        min: [0, "Total quantity cannot be negative"]
    },
    total_value: {
        type: Number,
        default: 0,
        min: [0, "Total value cannot be negative"]
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes for better performance
cartSchema.index({ user_id: 1 });
cartSchema.index({ user_id: 1, is_active: 1 });
cartSchema.index({ 'items.product': 1 });

// Method to update item active status based on stock
cartSchema.methods.updateItemsActiveStatus = function() {
    let hasChanges = false;
    
    this.items.forEach(item => {
        const shouldBeActive = item.variant_details.stock > 0 && 
                              item.variant_details.available && 
                              item.quantity <= item.variant_details.stock;
        
        if (item.is_active !== shouldBeActive) {
            item.is_active = shouldBeActive;
            hasChanges = true;
        }
    });
    
    return hasChanges;
};

// Method to calculate totals (only for active items)
cartSchema.methods.calculateTotals = function() {
    const activeItems = this.items.filter(item => item.is_active);
    this.total_quantity = activeItems.reduce((total, item) => total + item.quantity, 0);
    this.total_value = activeItems.reduce((total, item) => total + item.subtotal, 0);
    
    // Set cart as inactive if no active items
    this.is_active = activeItems.length > 0;
};

// Method to remove inactive items
cartSchema.methods.removeInactiveItems = function() {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.is_active);
    return this.items.length !== initialLength;
};

// Method to get only active items
cartSchema.methods.getActiveItems = function() {
    return this.items.filter(item => item.is_active);
};

// Pre-save middleware to update active status and calculate totals
cartSchema.pre('save', function(next) {
    this.updateItemsActiveStatus();
    this.calculateTotals();
    next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;