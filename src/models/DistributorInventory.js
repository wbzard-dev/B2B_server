const mongoose = require('mongoose');

const distributorInventorySchema = new mongoose.Schema({
    distributorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Distributor',
        required: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    quantity: {
        type: Number,
        default: 0,
        min: 0,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

// Ensure unique product per distributor
distributorInventorySchema.index({ distributorId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('DistributorInventory', distributorInventorySchema);
