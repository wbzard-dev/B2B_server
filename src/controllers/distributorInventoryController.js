const DistributorInventory = require("../models/DistributorInventory");
const DistributorSale = require("../models/DistributorSale");
const Product = require("../models/Product");

// Get distributor inventory
exports.getInventory = async (req, res) => {
    try {
        const inventory = await DistributorInventory.find({
            distributorId: req.user.entityId,
        }).populate("productId", "name sku price unit category shopName");
        res.json(inventory);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Update distributor inventory (manual adjustment or initial stock)
exports.updateInventory = async (req, res) => {
    const { productId, quantity } = req.body;
    try {
        let item = await DistributorInventory.findOne({
            distributorId: req.user.entityId,
            productId,
        });

        if (item) {
            item.quantity = quantity;
            item.lastUpdated = Date.now();
            await item.save();
        } else {
            item = new DistributorInventory({
                distributorId: req.user.entityId,
                productId,
                quantity,
            });
            await item.save();
        }

        res.json(item);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Report daily sales
exports.reportSales = async (req, res) => {
    const { date, items } = req.body;
    try {
        let totalAmount = 0;
        const saleItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) continue;

            const itemTotal = item.quantity * item.price;
            totalAmount += itemTotal;

            console.log(product);

            saleItems.push({
                productId: item.productId,
                name: product.name,
                sku: product.sku,
                quantity: item.quantity,
                price: item.price,
                total: itemTotal,
                shopName: item.shopName,
            });

            // Update inventory
            let invItem = await DistributorInventory.findOne({
                distributorId: req.user.entityId,
                productId: item.productId,
            });

            if (!invItem || invItem.quantity < item.quantity) {
                return res.status(400).json({
                    msg: `Insufficient inventory for ${product.name}. Available: ${invItem ? invItem.quantity : 0}`,
                });
            }

            invItem.quantity -= item.quantity;
            invItem.lastUpdated = Date.now();
            await invItem.save();
        }

        const newSale = new DistributorSale({
            distributorId: req.user.entityId,
            date: date || Date.now(),
            items: saleItems,
            totalAmount,
        });

        await newSale.save();
        res.json(newSale);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Get sales history for distributor
exports.getSalesHistory = async (req, res) => {
    try {
        const sales = await DistributorSale.find({
            distributorId: req.user.entityId,
        })
            .sort({ date: -1 })
            .populate("items.productId", "shopName name sku");

        // Map sales to include shopName from product if missing in sale item
        const salesWithShopName = sales.map((sale) => {
            const saleObj = sale.toObject();
            saleObj.items = saleObj.items.map((item) => {
                if (
                    !item.shopName &&
                    item.productId &&
                    item.productId.shopName
                ) {
                    item.shopName = item.productId.shopName;
                }
                return item;
            });
            return saleObj;
        });

        res.json(salesWithShopName);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};
// Get sales history for a specific distributor (Company access)
exports.getDistributorSalesForCompany = async (req, res) => {
    try {
        if (req.user.entityType !== "Company") {
            return res
                .status(403)
                .json({ msg: "Only companies can access this" });
        }

        // Verify the distributor belongs to this company
        const Distributor = require("../models/Distributor");
        const distributor = await Distributor.findById(
            req.params.distributorId,
        );

        if (!distributor) {
            return res.status(404).json({ msg: "Distributor not found" });
        }

        if (distributor.companyId.toString() !== req.user.entityId.toString()) {
            return res
                .status(403)
                .json({ msg: "Distributor does not belong to your company" });
        }

        const sales = await DistributorSale.find({
            distributorId: req.params.distributorId,
        })
            .sort({ date: -1 })
            .populate("items.productId", "shopName name sku");

        // Map sales to include shopName from product if missing in sale item
        const salesWithShopName = sales.map((sale) => {
            const saleObj = sale.toObject();
            saleObj.items = saleObj.items.map((item) => {
                if (
                    !item.shopName &&
                    item.productId &&
                    item.productId.shopName
                ) {
                    item.shopName = item.productId.shopName;
                }
                return item;
            });
            return saleObj;
        });

        res.json(salesWithShopName);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};
