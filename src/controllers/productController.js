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
// @access  Private (Company Admin)
exports.updateProduct = async (req, res) => {
    // Check role
    if (req.user.role !== 'company_admin') {
        return res.status(403).json({ msg: 'Not authorized' });
    }

    const { name, sku, description, price, unit, category, image, stock } = req.body;

    // Build product object
    const productFields = {};
    if (name) productFields.name = name;
    if (sku) productFields.sku = sku;
    if (description) productFields.description = description;
    if (price) productFields.price = price;
    if (unit) productFields.unit = unit;
    if (category) productFields.category = category;
    if (image) productFields.image = image;
    if (stock !== undefined) productFields.stock = stock;

    try {
        let product = await Product.findById(req.params.id);

        if (!product) return res.status(404).json({ msg: 'Product not found' });

        // Make sure user owns product
        if (product.companyId.toString() !== req.user.entityId.toString()) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        product = await Product.findByIdAndUpdate(req.params.id, { $set: productFields }, { new: true });
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
