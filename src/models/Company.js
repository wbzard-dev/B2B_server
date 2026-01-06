const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // Assuming company names are unique for now
    },
    registrationNumber: {
        type: String,
    },
    industry: {
        type: String,
    },
    address: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String,
    },
    contact: {
        phone: String,
        email: String,
    },
    settings: {
        currency: { type: String, default: 'INR' },
        paymentTerms: { type: String, default: 'Net 15' },
    },
    isActive: {
        type: Boolean,
        default: false, // Requires approval by default or email verification
    },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
