const mongoose = require("mongoose");

const distributorSaleSchema = new mongoose.Schema(
    {
        distributorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Distributor",
            required: true,
        },
        date: {
            type: Date,
            default: Date.now,
            required: true,
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                name: String,
                sku: String,
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                price: {
                    type: Number,
                    required: true,
                },
                total: {
                    type: Number,
                    required: true,
                },
                shopName: {
                    type: String,
                },
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model("DistributorSale", distributorSaleSchema);
