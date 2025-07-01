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

// Method to calculate totals
cartSchema.methods.calculateTotals = function() {
    this.total_quantity = this.items.reduce((total, item) => total + item.quantity, 0);
    this.total_value = this.items.reduce((total, item) => total + item.subtotal, 0);
};

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
    this.calculateTotals();
    next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;