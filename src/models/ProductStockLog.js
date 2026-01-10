const mongoose = require('mongoose');

const productStockLogSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
    oldStock: {
        type: Number,
        required: true,
    },
    newStock: {
        type: Number,
        required: true,
    },
    change: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        default: 'Manual Adjustment',
    }
}, { timestamps: true });

module.exports = mongoose.model('ProductStockLog', productStockLogSchema);
