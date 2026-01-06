const mongoose = require('mongoose');
const Company = require('./src/models/Company');
const Distributor = require('./src/models/Distributor');
require('dotenv').config();

const debugData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const companies = await Company.find();
        console.log('\n--- Companies ---');
        companies.forEach(c => console.log(`ID: ${c._id}, Name: ${c.name}`));

        const distributors = await Distributor.find();
        console.log('\n--- Distributors ---');
        distributors.forEach(d => console.log(`ID: ${d._id}, Name: ${d.name}, Status: ${d.status}, LinkedCompany: ${d.companyId}`));

        // Check for orphans or mismatches
        if (companies.length > 0) {
            const firstCompany = companies[0];
            console.log(`\nDefault Company (via findOne()): ${firstCompany._id} (${firstCompany.name})`);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugData();
