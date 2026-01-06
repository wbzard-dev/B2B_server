const mongoose = require('mongoose');

const distributorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: false, // For MVP, linked to a company
    },
    contactPerson: {
        name: String,
        phone: String,
        email: String,
    },
    address: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Active', 'Suspended', 'Inactive'],
        default: 'Pending',
    },
    creditLimit: {
        type: Number,
        default: 0,
    },
    creditUtilized: {
        type: Number,
        default: 0,
    },
    paymentTerms: {
        type: String, // Can override company default
    },
}, { timestamps: true });

module.exports = mongoose.model('Distributor', distributorSchema);
