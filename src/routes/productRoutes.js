const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/authMiddleware');
const productController = require('../controllers/productController');

// @route   POST api/products
// @desc    Add a new product
// @access  Private (Company)
router.post(
    '/',
    [
        auth,
        [
            check('name', 'Name is required').not().isEmpty(),
            check('sku', 'SKU is required').not().isEmpty(),
            check('price', 'Price is required').isNumeric(),
            check('unit', 'Unit is required').not().isEmpty(),
        ]
    ],
    productController.addProduct
);

// @route   GET api/products
// @desc    Get all products
// @access  Private
router.get('/', auth, productController.getProducts);

// @route   GET api/products/:id
// @desc    Get product by ID
// @access  Private
router.get('/:id', auth, productController.getProductById);

// @route   PUT api/products/:id
// @desc    Update product
// @access  Private (Company)
router.put('/:id', auth, productController.updateProduct);

// Get product logs
router.get('/:id/logs', auth, productController.getProductLogs);

module.exports = router;
