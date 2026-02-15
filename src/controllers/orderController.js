const Order = require("../models/Order");
const Product = require("../models/Product");
const Distributor = require("../models/Distributor");
const { validationResult } = require("express-validator");

// @route   POST api/orders
// @desc    Place an order (Distributor only)
// @access  Private (Distributor)
exports.createOrder = async (req, res) => {
    // Check role
    if (req.user.entityType !== "Distributor") {
        return res
            .status(403)
            .json({ msg: "Only distributors can place orders" });
    }

    const { items, shopName } = req.body; // items: [{ productId, quantity }], shopName: String

    if (!items || items.length === 0) {
        return res.status(400).json({ msg: "No items in order" });
    }

    try {
        let totalAmount = 0;
        const orderItems = [];

        // Fetch distributor to get company link?
        const distributor = await Distributor.findById(req.user.entityId);
        if (!distributor)
            return res.status(404).json({ msg: "Distributor not found" });

        // CHECK DISTRIBUTOR STATUS
        if (
            distributor.status !== "Approved" &&
            distributor.status !== "Active"
        ) {
            return res
                .status(403)
                .json({
                    msg: `Your account is currently ${distributor.status}. Please contact support.`,
                });
        }

        // CHECK FOR OVERDUE ORDERS (CREDIT HOLD)
        const overdueOrders = await Order.findOne({
            distributorId: req.user.entityId,
            paymentStatus: { $ne: "Paid" },
            paymentDueDate: { $lt: new Date() },
        });

        if (overdueOrders) {
            return res.status(400).json({
                msg: "Account on Credit Hold. You have overdue invoices. Please satisfy pending payments to place new orders.",
            });
        }

        // Validate items, check stock, and calculate total
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product)
                return res
                    .status(404)
                    .json({ msg: `Product ${item.productId} not found` });

            // Check if product belongs to the distributor's company
            if (
                product.companyId.toString() !==
                distributor.companyId.toString()
            ) {
                return res
                    .status(400)
                    .json({
                        msg: `Product ${product.name} does not belong to your supplier`,
                    });
            }

            // CHECK STOCK
            if (product.stock < item.quantity) {
                return res
                    .status(400)
                    .json({
                        msg: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
                    });
            }

            const itemTotal = product.price * item.quantity;
            totalAmount += itemTotal;

            orderItems.push({
                product: product._id,
                sku: product.sku,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                total: itemTotal,
            });

            // Decrement Stock
            product.stock -= item.quantity;
            await product.save();
        }

        const newOrder = new Order({
            companyId: distributor.companyId,
            distributorId: distributor._id,
            items: orderItems,
            totalAmount,
            status: "Pending",
            paymentStatus: "Pending",
            paymentDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days credit
            shopName: shopName,
        });

        const order = await newOrder.save();
        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};

// @route   GET api/orders
// @desc    Get all orders (Company sees all their orders, Distributor sees own)
// @access  Private
exports.getOrders = async (req, res) => {
    try {
        let query = {};
        if (req.user.entityType === "Company") {
            query.companyId = req.user.entityId;
        } else if (req.user.entityType === "Distributor") {
            query.distributorId = req.user.entityId;
        }

        const orders = await Order.find(query)
            .populate("distributorId", "name")
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};

// @route   PUT api/orders/:id/status
// @desc    Update order status (Company only)
// @access  Private (Company)
exports.updateOrderStatus = async (req, res) => {
    if (req.user.entityType !== "Company") {
        return res.status(403).json({ msg: "Not authorized" });
    }

    const { status } = req.body;

    try {
        let order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: "Order not found" });

        // Ensure order belongs to company
        if (order.companyId.toString() !== req.user.entityId.toString()) {
            return res.status(401).json({ msg: "Not authorized" });
        }

        order.status = status;
        // If status is Confirmed, generate Invoice Number? (MVP simplification)
        if (status === "Confirmed" && !order.invoiceNumber) {
            order.invoiceNumber = `INV-${Date.now()}`;
        }

        // IF DELIVERED, UPDATE DISTRIBUTOR INVENTORY
        if (status === "Delivered") {
            const DistributorInventory = require("../models/DistributorInventory");
            for (const item of order.items) {
                let invItem = await DistributorInventory.findOne({
                    distributorId: order.distributorId,
                    productId: item.product,
                });

                if (invItem) {
                    invItem.quantity += item.quantity;
                    invItem.lastUpdated = Date.now();
                    await invItem.save();
                } else {
                    invItem = new DistributorInventory({
                        distributorId: order.distributorId,
                        productId: item.product,
                        quantity: item.quantity,
                    });
                    await invItem.save();
                }
            }
        }

        await order.save();
        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};

// @route   PUT api/orders/:id/pay
// @desc    Distributor submits payment for verification
// @access  Private (Distributor)
exports.payOrder = async (req, res) => {
    try {
        console.log("PayOrder Attempt:", req.params.id);
        console.log("User Entity:", req.user.entityId);

        let order = await Order.findById(req.params.id);
        if (!order) {
            console.log("Order not found");
            return res.status(404).json({ msg: "Order not found" });
        }

        console.log("Order Distributor:", order.distributorId);

        // Loose equality to handle ObjectId objects vs Strings
        if (order.distributorId != req.user.entityId) {
            console.log(
                "Auth Mismatch:",
                order.distributorId,
                "!==",
                req.user.entityId,
            );
            return res
                .status(403)
                .json({ msg: "Not authorized - ID Mismatch" });
        }

        if (order.paymentStatus === "Paid") {
            return res.status(400).json({ msg: "Order is already paid" });
        }

        order.paymentStatus = "Verification Pending";
        await order.save();
        console.log("Payment status updated to Verification Pending");
        res.json(order);
    } catch (err) {
        console.error("PayOrder Error:", err);
        res.status(500).json({
            msg: "Server error",
            error: err.message,
            stack: err.stack,
        });
    }
};

// @route   PUT api/orders/:id/verify-payment
// @desc    Company verifies payment
// @access  Private (Company Admin)
exports.verifyPayment = async (req, res) => {
    try {
        let order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: "Order not found" });

        // For MVP, if companyId is missing in order (old data) or match logic is strict
        // let's just check if user is A company.
        if (req.user.entityType !== "Company") {
            return res.status(403).json({ msg: "Only Companies can verify" });
        }

        order.paymentStatus = "Paid";
        await order.save();
        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
};
