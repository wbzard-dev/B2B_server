const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const distributorController = require('../controllers/distributorController');

// @route   GET api/distributors
// @desc    Get all distributors for a company
// @access  Private (Company)
router.get('/', auth, distributorController.getDistributors);

// @route   PUT api/distributors/:id/status
// @desc    Update distributor status
// @access  Private (Company)
router.put('/:id/status', auth, distributorController.updateDistributorStatus);

module.exports = router;
