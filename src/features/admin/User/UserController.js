const User = require('../../user/auth/UserModel');
const bcrypt = require('bcrypt');
const Cart = require('../../user/Cart/CartModel')
exports.createUser = async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  try {
    // Validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ message: 'Name, email, phone, and password are required' }]
      });
    }

    // Check if email already exists
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'email', message: 'Email already exists' }]
      });
    }

    // Check if phone already exists
    const existingPhoneUser = await User.findOne({ phone });
    if (existingPhoneUser) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'phone', message: 'Phone number already exists' }]
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'user' // Default role
    });

    await newUser.save();

    // Return user without sensitive data
    const createdUser = await User.findById(newUser._id)
      .select('-password -__v -refreshToken');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: createdUser
    });
  } catch (error) {
    console.error('Create User Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [{ message: error.message }]
    });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // Extract pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Optional search functionality
    const search = req.query.search || '';
    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    } : {};

    // Optional role filter
    const role = req.query.role;
    if (role) {
      searchQuery.role = role;
    }

    // Get total count for pagination info
    const totalUsers = await User.countDocuments(searchQuery);
    const totalPages = Math.ceil(totalUsers / limit);

    // Get paginated users
    const users = await User.find(searchQuery)
      .select('-password -__v -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages,
      totalUsers,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      limit
    };

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      pagination
    });
  } catch (error) {
    console.error('Get All Users Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [{ message: error.message }]
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -__v -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: [{ message: 'No user found with this ID' }]
      });
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error('Get User By ID Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [{ message: error.message }]
    });
  }
};

exports.updateUserById = async (req, res) => {
  const { name, email, phone, role } = req.body;

  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: [{ message: 'No user found with this ID' }]
      });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{ field: 'email', message: 'Email already exists' }]
        });
      }
    }

    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({ phone, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [{ field: 'phone', message: 'Phone number already exists' }]
        });
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password -__v -refreshToken');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update User Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [{ message: error.message }]
    });
  }
};

exports.deleteUserById = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: [{ message: 'No user found with this ID' }]
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete User Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [{ message: error.message }]
    });
  }
};



exports.getUserCart = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if user exists
    const user = await User.findById(userId).select('-password -__v -refreshToken');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: [{ message: 'No user found with this ID' }]
      });
    }

    // Find the user's active cart (single document)
    const cart = await Cart.findOne({ user_id: userId, is_active: true })
      .populate('items.product', 'name images weight_category price'); 

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: 'User cart is empty',
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email
          },
          cartItems: [],
          summary: {
            totalItems: 0,
            totalAmount: 0,
            itemCount: 0
          }
        }
      });
    }

    // Calculate cart summary
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.items.reduce((sum, item) => {
      return sum + (item.quantity * (item.variant_details?.price || 0));
    }, 0);

    const cartSummary = {
      totalItems,
      totalAmount: totalAmount.toFixed(2),
      itemCount: cart.items.length
    };

    res.status(200).json({
      success: true,
      message: 'User cart retrieved successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        },
        cartItems: cart.items,
        summary: cartSummary
      }
    });
  } catch (error) {
    console.error('Get User Cart Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      errors: [{ message: error.message }]
    });
  }
};