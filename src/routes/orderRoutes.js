const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

router.post('/', auth, orderController.createOrder);
router.get('/', auth, orderController.getOrders);
router.put('/:id/status', auth, orderController.updateOrderStatus);
router.put('/:id/pay', auth, orderController.payOrder);
router.put('/:id/verify-payment', auth, orderController.verifyPayment);

module.exports = router;
