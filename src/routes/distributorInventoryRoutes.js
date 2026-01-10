const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const distributorInventoryController = require('../controllers/distributorInventoryController');

// All routes require authentication
router.get('/inventory', auth, distributorInventoryController.getInventory);
router.post('/inventory/update', auth, distributorInventoryController.updateInventory);
router.post('/sales/report', auth, distributorInventoryController.reportSales);
router.get('/sales/history', auth, distributorInventoryController.getSalesHistory);
router.get('/company/sales/:distributorId', auth, distributorInventoryController.getDistributorSalesForCompany);

module.exports = router;
