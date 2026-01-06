const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    sku: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    unit: {
        type: String, // e.g., 'pcs', 'kg', 'box'
        required: true,
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
    },
    category: {
        type: String,
    },
    image: {
        type: String, // URL
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

// Ensure SKU is unique per company
productSchema.index({ companyId: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
