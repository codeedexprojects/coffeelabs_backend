const Address = require('./AddressModel');
const User = require('../auth/UserModel');

exports.addAddress = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      name,
      addressType,
      address,
      city,
      state,
      pincode,
      country,
      landmark,
      isDefault
    } = req.body;

    // Validate required fields
    if (!name || !addressType || !address || !city || !state || !pincode) {
      return res.status(400).json({ 
        message: 'Required fields missing',
        required: ['name', 'addressType', 'address', 'city', 'state', 'pincode']
      });
    }

    // Validate pincode format (assuming Indian pincode format)
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode)) {
      return res.status(400).json({ message: 'Invalid pincode format. Must be 6 digits.' });
    }

    // Check if this is the user's first address, make it default
    const existingAddresses = await Address.find({ user: userId });
    const shouldBeDefault = existingAddresses.length === 0 || isDefault;

    const newAddress = new Address({
      user: userId,
      name,
      addressType,
      address,
      city,
      state,
      pincode,
      country: country || 'India',
      landmark,
      isDefault: shouldBeDefault
    });

    await newAddress.save();

    res.status(201).json({
      message: 'Address added successfully',
      address: newAddress
    });
  } catch (error) {
    console.error('Add Address Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAddresses = async (req, res) => {
  try {
    // Get user ID from req.user (set by verifyToken middleware)
    const userId = req.user.id;

    // Sort by isDefault first (true first), then by creation date (newest first)
    const addresses = await Address.find({ user: userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      message: 'Addresses retrieved successfully',
      addresses,
      count: addresses.length
    });
  } catch (error) {
    console.error('Get Addresses Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    // Get user ID from req.user (set by verifyToken middleware)
    const userId = req.user.id;
    const { addressId } = req.params;

    // Validate addressId
    if (!addressId || !addressId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid address ID' });
    }

    const {
      name,
      addressType,
      address,
      city,
      state,
      pincode,
      country,
      landmark,
      isDefault
    } = req.body;

    // Check if address belongs to user
    const existingAddress = await Address.findOne({ _id: addressId, user: userId });
    if (!existingAddress) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Validate pincode format if provided
    if (pincode) {
      const pincodeRegex = /^\d{6}$/;
      if (!pincodeRegex.test(pincode)) {
        return res.status(400).json({ message: 'Invalid pincode format. Must be 6 digits.' });
      }
    }

    // Prepare update data (only include fields that are provided)
    const updateData = {};
    if (name) updateData.name = name;
    if (addressType) updateData.addressType = addressType;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (pincode) updateData.pincode = pincode;
    if (country) updateData.country = country;
    if (landmark !== undefined) updateData.landmark = landmark;
    if (typeof isDefault === 'boolean') updateData.isDefault = isDefault;

    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Address updated successfully',
      address: updatedAddress
    });
  } catch (error) {
    console.error('Update Address Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    // Get user ID from req.user (set by verifyToken middleware)
    const userId = req.user.id;
    const { addressId } = req.params;

    // Validate addressId
    if (!addressId || !addressId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid address ID' });
    }

    // Check if address belongs to user
    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await Address.findByIdAndDelete(addressId);

    // If deleted address was default, set another address as default
    if (address.isDefault) {
      const remainingAddress = await Address.findOne({ user: userId })
        .sort({ createdAt: -1 });
      
      if (remainingAddress) {
        await Address.findByIdAndUpdate(remainingAddress._id, { isDefault: true });
      }
    }

    res.status(200).json({
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete Address Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    // Get user ID from req.user (set by verifyToken middleware)
    const userId = req.user.id;
    const { addressId } = req.params;

    // Validate addressId
    if (!addressId || !addressId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid address ID' });
    }

    // Check if address belongs to user
    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Update all addresses to set isDefault to false
    await Address.updateMany(
      { user: userId },
      { $set: { isDefault: false } }
    );

    // Set the selected address as default
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      { $set: { isDefault: true } },
      { new: true }
    );

    res.status(200).json({
      message: 'Default address set successfully',
      address: updatedAddress
    });
  } catch (error) {
    console.error('Set Default Address Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};