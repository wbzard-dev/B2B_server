const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
        },
        distributorId: {
            type: mongoose.Schema.Types.ObjectId, // User.entityId (Distributor)
            ref: "Distributor",
            required: true,
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                },
                sku: String,
                name: String,
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                price: Number, // Unit price at time of order
                total: Number, // Qty * Price
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Canceled"],
            default: "Pending",
        },
        paymentStatus: {
            type: String,
            enum: [
                "Pending",
                "Verification Pending",
                "Paid",
                "Partial",
                "Overdue",
                "Failed",
            ],
            default: "Pending",
        },
        invoiceNumber: {
            type: String, // Generated on confirmation
        },
        paymentDueDate: {
            type: Date,
        },
        shopName: {
            type: String,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
