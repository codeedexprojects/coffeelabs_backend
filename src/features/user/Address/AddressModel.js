const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  addressType: {
    type: String,
    enum: ['home', 'office', 'shop'],
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true,
    default: 'India'
  },
  landmark: {
    type: String,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Ensure only one default address per user
addressSchema.pre('save', async function(next) {
  if (this.isDefault) {
    try {
      await this.constructor.updateMany(
        { user: this.user, _id: { $ne: this._id } },
        { $set: { isDefault: false } }
      );
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Address', addressSchema);