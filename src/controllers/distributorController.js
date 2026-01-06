const Distributor = require('../models/Distributor');
const mongoose = require('mongoose');

// @route   GET api/distributors
// @desc    Get all distributors for a company
// @access  Private (Company)
exports.getDistributors = async (req, res) => {
    if (req.user.entityType !== 'Company') {
        return res.status(403).json({ msg: 'Not authorized' });
    }

    try {
        // Ensure entityId is treated correctly for query
        const companyId = req.user.entityId;
        console.log('Fetching distributors for companyId:', companyId);

        const distributors = await Distributor.find({ companyId: companyId }).sort({ createdAt: -1 });
        console.log(`Found ${distributors.length} distributors`);

        res.json(distributors);
    } catch (err) {
        console.error('getDistributors error:', err.message);
        res.status(500).send('Server error');
    }
};

// @route   PUT api/distributors/:id/status
// @desc    Update distributor status (Approve/Suspend)
// @access  Private (Company)
exports.updateDistributorStatus = async (req, res) => {
    if (req.user.entityType !== 'Company') {
        return res.status(403).json({ msg: 'Not authorized' });
    }

    const { status } = req.body;

    try {
        let distributor = await Distributor.findById(req.params.id);
        if (!distributor) return res.status(404).json({ msg: 'Distributor not found' });

        // Ensure distributor belongs to company
        if (distributor.companyId && distributor.companyId.toString() !== req.user.entityId.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        distributor.status = status;
        await distributor.save();
        res.json(distributor);
    } catch (err) {
        console.error('updateDistributorStatus error:', err.message);
        res.status(500).send('Server error');
    }
};
