const mongoose = require("mongoose");

const shopDataSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        location: {
            type: String,
        },
        phoneNumber: {
            type: Number,
        },
        distributorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Distributor",
            required: true,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model("ShopData", shopDataSchema);
