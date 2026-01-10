const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const analyticsController = require('../controllers/analyticsController');

// @route   GET api/analytics/company
// @desc    Get company analytics
// @access  Private (Company)
router.get('/company', auth, analyticsController.getCompanyAnalytics);

module.exports = router;
