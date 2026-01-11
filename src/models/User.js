const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: [
                "company_admin",
                "company_user",
                "distributor_admin",
                "distributor_user",
                "super_admin",
            ],
            default: "distributor_admin",
        },
        profileImage: {
            type: String,
            default: "",
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "entityType",
        },
        entityType: {
            type: String,
            required: true,
            enum: ["Company", "Distributor"],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
