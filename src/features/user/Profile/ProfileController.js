const User = require('../auth/UserModel');
const bcrypt = require('bcrypt');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -__v -googleId -appleId -playerId -isActive');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found',
        errors: [{ message: 'No user found with this ID' }]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error('Get Profile Error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      errors: [{ message: error.message }]
    });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, email, phone } = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found',
        errors: [{ message: 'No user found with this ID' }]
      });
    }

    // Check for duplicate email or phone
    const duplicateConditions = [];
    if (email && email !== user.email) duplicateConditions.push({ email });
    if (phone && phone !== user.phone) duplicateConditions.push({ phone });

    if (duplicateConditions.length > 0) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: user._id } },
          { $or: duplicateConditions }
        ]
      });
      
      if (existingUser) {
        const errors = [];
        if (existingUser.email === email) {
          errors.push({ field: 'email', message: 'Email already exists' });
        }
        if (existingUser.phone === phone) {
          errors.push({ field: 'phone', message: 'Phone number already exists' });
        }
        return res.status(400).json({ 
          success: false,
          message: 'Validation failed',
          errors
        });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password -__v -googleId -appleId -playerId -isActive');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      errors: [{ message: error.message }]
    });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found',
        errors: [{ message: 'No user found with this ID' }]
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'currentPassword', message: 'Current password is incorrect' }]
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ 
      success: true,
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Change Password Error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      errors: [{ message: error.message }]
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found',
        errors: [{ message: 'No user found with this ID' }]
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Account deleted successfully' 
    });
  } catch (error) {
    console.error('Delete Account Error:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      errors: [{ message: error.message }]
    });
  }
};