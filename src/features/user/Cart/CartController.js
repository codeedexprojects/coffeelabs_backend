const Cart = require('./CartModel');
const Product = require('../../admin/Product/ProductModel');

// Create or add new product to cart
exports.createOrUpdateCart = async (req, res) => {
    try {
        const { product_id, variant_id, quantity = 1 } = req.body;
        const userId = req.user.id; 

        // Validate required fields
        if (!product_id || !variant_id) {
            return res.status(400).json({
                success: false,
                message: "Product ID and variant ID are required"
            });
        }

        // Fetch product with variant details
        const product = await Product.findById(product_id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Check if product is available
        if (!product.is_available) {
            return res.status(400).json({
                success: false,
                message: "Product is not available"
            });
        }

        // Find the specific variant
        const variant = product.variants.id(variant_id);
        if (!variant) {
            return res.status(404).json({
                success: false,
                message: "Product variant not found"
            });
        }

        // Validate variant availability and stock
        if (!variant.available || variant.stock === 0) {
            return res.status(400).json({
                success: false,
                message: "Selected variant is not available or out of stock"
            });
        }

        if (variant.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Only ${variant.stock} items available`
            });
        }

        // Find or create user cart
        let cart = await Cart.findOne({ user_id: userId, is_active: true });
        if (!cart) {
            cart = new Cart({ user_id: userId, items: [] });
        }

        // Check if item already exists in cart (same product and variant)
        const existingItemIndex = cart.items.findIndex(
            item => item.product.toString() === product_id && 
                   item.variant_id.toString() === variant_id
        );

        if (existingItemIndex !== -1) {
            // Update existing item quantity
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;
            
            // Check stock for updated quantity
            if (variant.stock < newQuantity) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot add ${quantity} more items. Only ${variant.stock} total available, you already have ${cart.items[existingItemIndex].quantity} in cart`
                });
            }

            cart.items[existingItemIndex].quantity = newQuantity;
            cart.items[existingItemIndex].subtotal = newQuantity * variant.price;
            cart.items[existingItemIndex].variant_details = {
                variant_type: variant.variant_type,
                price: variant.price,
                stock: variant.stock,
                available: variant.available
            };
            // is_active will be updated automatically in pre-save middleware
        } else {
            // Add new item to cart
            const cartItem = {
                product: product_id,
                variant_id: variant_id,
                quantity: quantity,
                variant_details: {
                    variant_type: variant.variant_type,
                    price: variant.price,
                    stock: variant.stock,
                    available: variant.available
                },
                subtotal: quantity * variant.price,
                is_active: variant.stock > 0 && variant.available && quantity <= variant.stock
            };
            cart.items.push(cartItem);
        }

        await cart.save();

        // Populate product details for response
        await cart.populate('items.product', 'name images weight_category');

        res.status(200).json({
            success: true,
            message: "Item added to cart successfully",
            data: cart
        });

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update cart item quantity
exports.updateCartQuantity = async (req, res) => {
    try {
        const { product_id, variant_id, quantity } = req.body;
        const userId = req.user.id;

        if (!product_id || !variant_id || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Valid product ID, variant ID, and quantity are required"
            });
        }

        // Find user cart
        const cart = await Cart.findOne({ user_id: userId, is_active: true });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        // Find cart item
        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === product_id && 
                   item.variant_id.toString() === variant_id
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart"
            });
        }

        // Get current product and variant for stock validation
        const product = await Product.findById(product_id);
        const variant = product.variants.id(variant_id);

        if (!variant || !variant.available || variant.stock === 0) {
            return res.status(400).json({
                success: false,
                message: "Product variant is no longer available or out of stock"
            });
        }

        if (variant.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Only ${variant.stock} items available`
            });
        }

        // Update item
        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].subtotal = quantity * variant.price;
        cart.items[itemIndex].variant_details = {
            variant_type: variant.variant_type,
            price: variant.price,
            stock: variant.stock,
            available: variant.available
        };
        // is_active will be updated automatically in pre-save middleware

        await cart.save();
        await cart.populate('items.product', 'name images weight_category');

        res.status(200).json({
            success: true,
            message: "Cart item updated successfully",
            data: cart
        });

    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Remove specific variant product from cart
exports.removeProductFromCart = async (req, res) => {
    try {
        const { product_id, variant_id } = req.body;
        const userId = req.user.id;

        if (!product_id || !variant_id) {
            return res.status(400).json({
                success: false,
                message: "Product ID and variant ID are required"
            });
        }

        // Find user cart
        const cart = await Cart.findOne({ user_id: userId, is_active: true });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        // Check if item exists before removal
        const itemExists = cart.items.some(
            item => item.product.toString() === product_id && 
                   item.variant_id.toString() === variant_id
        );

        if (!itemExists) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart"
            });
        }

        // Remove specific variant item from cart
        cart.items = cart.items.filter(
            item => !(item.product.toString() === product_id && 
                     item.variant_id.toString() === variant_id)
        );

        await cart.save();
        await cart.populate('items.product', 'name images weight_category');

        res.status(200).json({
            success: true,
            message: "Item removed from cart successfully",
            data: cart
        });

    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get user cart
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find user cart with populated product details
        const cart = await Cart.findOne({ user_id: userId, is_active: true })
            .populate({
                path: 'items.product',
                select: 'name images weight_category variants',
                match: { is_available: true }
            });

        if (!cart || cart.items.length === 0) {
            return res.status(200).json({
                success: true,
                message: "Cart is empty",
                data: {
                    items: [],
                    total_quantity: 0,
                    total_value: 0,
                    inactive_items: []
                }
            });
        }

        // Filter out items where product is no longer available
        cart.items = cart.items.filter(item => item.product !== null);

        // Validate and update stock information for each item
        let hasChanges = false;
        const inactiveItems = [];
        
        for (let item of cart.items) {
            const currentVariant = item.product.variants.id(item.variant_id);
            if (currentVariant) {
                // Update variant details
                const oldStock = item.variant_details.stock;
                item.variant_details = {
                    variant_type: currentVariant.variant_type,
                    price: currentVariant.price,
                    stock: currentVariant.stock,
                    available: currentVariant.available
                };

                // Update subtotal if price changed
                if (item.variant_details.price !== (item.subtotal / item.quantity)) {
                    item.subtotal = item.quantity * currentVariant.price;
                    hasChanges = true;
                }

                // Check if stock changed
                if (oldStock !== currentVariant.stock) {
                    hasChanges = true;
                }
            } else {
                // Variant no longer exists
                item.variant_details.available = false;
                item.variant_details.stock = 0;
                hasChanges = true;
            }
        }

        // Update active status and save if needed
        if (hasChanges) {
            cart.updateItemsActiveStatus();
            await cart.save();
        }

        // Separate active and inactive items
        const activeItems = cart.getActiveItems();
        const allInactiveItems = cart.items.filter(item => !item.is_active);

        // Format response data
        const formattedCart = {
            _id: cart._id,
            user_id: cart.user_id,
            items: activeItems.map(item => ({
                _id: item._id,
                product: {
                    _id: item.product._id,
                    name: item.product.name,
                    images: item.product.images,
                    weight_category: item.product.weight_category
                },
                variant: {
                    _id: item.variant_id,
                    variant_type: item.variant_details.variant_type,
                    price: item.variant_details.price,
                    stock: item.variant_details.stock,
                    available: item.variant_details.available
                },
                quantity: item.quantity,
                subtotal: item.subtotal,
                is_active: item.is_active
            })),
            inactive_items: allInactiveItems.map(item => ({
                _id: item._id,
                product: {
                    _id: item.product._id,
                    name: item.product.name,
                    images: item.product.images,
                    weight_category: item.product.weight_category
                },
                variant: {
                    _id: item.variant_id,
                    variant_type: item.variant_details.variant_type,
                    price: item.variant_details.price,
                    stock: item.variant_details.stock,
                    available: item.variant_details.available
                },
                quantity: item.quantity,
                subtotal: item.subtotal,
                is_active: item.is_active,
                reason: item.variant_details.stock === 0 ? 'Out of stock' : 'Not available'
            })),
            total_quantity: cart.total_quantity,
            total_value: cart.total_value,
            created_at: cart.createdAt,
            updated_at: cart.updatedAt
        };

        res.status(200).json({
            success: true,
            message: "Cart retrieved successfully",
            data: formattedCart
        });

    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Clear entire cart (Delete cart)
exports.deleteCart = async (req, res) => {
    try {
        const { userId } = req.params;
        const tokenUserId = req.user.id;

        // Ensure user can only delete their own cart
        if (userId !== tokenUserId) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only delete your own cart"
            });
        }

        const cart = await Cart.findOne({ user_id: userId, is_active: true });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        cart.items = [];
        await cart.save();

        res.status(200).json({
            success: true,
            message: "Cart deleted successfully",
            data: cart
        });

    } catch (error) {
        console.error('Delete cart error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get all carts with pagination (Admin function)
exports.getAllCarts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { user_id } = req.query;
        
        const query = { is_active: true };
        if (user_id) {
            query.user_id = user_id;
        }

        const total = await Cart.countDocuments(query);
        const carts = await Cart.find(query)
            .populate({
                path: 'items.product',
                select: 'name images weight_category'
            })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        const formattedCarts = carts.map(cart => ({
            _id: cart._id,
            user_id: cart.user_id,
            total_items: cart.items.length,
            active_items: cart.getActiveItems().length,
            total_quantity: cart.total_quantity,
            total_value: cart.total_value,
            last_updated: cart.updatedAt,
            items: cart.items.map(item => ({
                product_name: item.product?.name || 'Product not found',
                variant_type: item.variant_details.variant_type,
                quantity: item.quantity,
                price: item.variant_details.price,
                subtotal: item.subtotal,
                is_active: item.is_active,
                stock: item.variant_details.stock
            }))
        }));

        res.status(200).json({
            success: true,
            message: "Carts retrieved successfully",
            data: {
                totalItems: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                carts: formattedCarts
            }
        });

    } catch (error) {
        console.error('Get all carts error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// New function to clean up inactive items from all carts
exports.cleanupInactiveItems = async (req, res) => {
    try {
        const carts = await Cart.find({ is_active: true });
        let totalCleaned = 0;
        
        for (let cart of carts) {
            const removed = cart.removeInactiveItems();
            if (removed) {
                await cart.save();
                totalCleaned++;
            }
        }

        res.status(200).json({
            success: true,
            message: `Cleaned up inactive items from ${totalCleaned} carts`,
            data: { carts_cleaned: totalCleaned }
        });

    } catch (error) {
        console.error('Cleanup inactive items error:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};