const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// @route   POST api/products
// @desc    Add a new product (Company only)
// @access  Private (Company Admin/User)
exports.addProduct = async (req, res) => {
    // Check role
    if (req.user.role !== 'company_admin' && req.user.role !== 'company_user') {
        return res.status(403).json({ msg: 'Not authorized' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, sku, description, price, unit, category, image, stock } = req.body;

    try {
        const newProduct = new Product({
            companyId: req.user.entityId,
            name,
            sku,
            description,
            price,
            unit,
            category,
            image,
            stock: stock || 0,
        });

        const product = await newProduct.save();
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET api/products
// @desc    Get all products
// @access  Private
exports.getProducts = async (req, res) => {
    try {
        let query = {};
        if (req.user.entityType === 'Company') {
            query.companyId = req.user.entityId;
        } else if (req.user.entityType === 'Distributor') {
            // Fetch distributor to get companyId
            const Distributor = require('../models/Distributor');
            const distributor = await Distributor.findById(req.user.entityId);
            if (distributor && distributor.companyId) {
                query.companyId = distributor.companyId;
            }
        }

        const products = await Product.find(query).sort({ updatedAt: -1 });
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET api/products/:id
// @desc    Get product by ID
// @access  Private
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: 'Product not found' });
        res.json(product);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Product not found' });
        res.status(500).send('Server error');
    }
};

// @route   PUT api/products/:id
// @desc    Update a product (Company only)
// @access  Private (Company Admin/User)
exports.updateProduct = async (req, res) => {
    // Check role
    if (req.user.role !== 'company_admin' && req.user.role !== 'company_user') {
        return res.status(403).json({ msg: 'Not authorized' });
    }

    const { name, sku, description, price, unit, category, image, stock, reason } = req.body;

    // Restricted update for company_user: can only update stock
    if (req.user.role === 'company_user' && (name || sku || description || price || unit || category || image)) {
        return res.status(403).json({ msg: 'Employees can only update stock' });
    }

    try {
        let product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: 'Product not found' });

        // Make sure user owns product
        if (product.companyId.toString() !== req.user.entityId.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const oldStock = product.stock;
        let stockChange = 0;

        // Build product object
        if (name && req.user.role === 'company_admin') product.name = name;
        if (sku && req.user.role === 'company_admin') product.sku = sku;
        if (description && req.user.role === 'company_admin') product.description = description;
        if (price && req.user.role === 'company_admin') product.price = price;
        if (unit && req.user.role === 'company_admin') product.unit = unit;
        if (category && req.user.role === 'company_admin') product.category = category;
        if (image && req.user.role === 'company_admin') product.image = image;

        // stockAdjustment handles increments (+50)
        // stock handles absolute reset (from admin edit)
        if (stock !== undefined) {
            stockChange = stock - oldStock;
            product.stock = stock;
        } else if (req.body.stockAdjustment !== undefined) {
            stockChange = parseInt(req.body.stockAdjustment);
            product.stock += stockChange;
        }

        if (stockChange !== 0 || stock !== undefined) {
            // Log the stock change
            const ProductStockLog = require('../models/ProductStockLog');
            const logEntry = new ProductStockLog({
                productId: product._id,
                userId: req.user.id,
                companyId: req.user.entityId,
                oldStock,
                newStock: product.stock,
                change: stockChange,
                reason: reason || (req.user.role === 'company_user' ? 'Employee Stock Adjustment' : 'Admin Stock Adjustment')
            });
            await logEntry.save();
        }

        await product.save();
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @route   GET api/products/:id/logs
// @desc    Get stock history logs for a product
// @access  Private (Company)
exports.getProductLogs = async (req, res) => {
    if (req.user.entityType !== 'Company') {
        return res.status(403).json({ msg: 'Not authorized' });
    }

    try {
        const ProductStockLog = require('../models/ProductStockLog');
        const logs = await ProductStockLog.find({ productId: req.params.id })
            .populate('userId', 'name')
            .populate('productId', 'name sku')
            .sort({ createdAt: -1 });
        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
