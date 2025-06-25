const mongoose = require('mongoose'); 

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        unique: true,
        index: true,
        trim: true
    },
    image: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const category = mongoose.model('Category', categorySchema);
module.exports = category