const Order = require('../models/Order');
const DistributorSale = require('../models/DistributorSale');
const Distributor = require('../models/Distributor');
const Product = require('../models/Product');

exports.getCompanyAnalytics = async (req, res) => {
    try {
        if (req.user.entityType !== 'Company') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const companyId = req.user.entityId;

        // 1. Total Restocking (Delivered Orders)
        const restockingOrders = await Order.find({
            companyId,
            status: 'Delivered'
        });

        const totalRestocking = restockingOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);

        // 2. Total Distributor Sales
        // First find all distributors for this company
        const distributors = await Distributor.find({ companyId });
        const distributorIds = distributors.map(d => d._id);

        const sales = await DistributorSale.find({
            distributorId: { $in: distributorIds }
        });

        const totalDistSales = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);

        // 3. Performance by Distributor
        const distributorPerformance = distributors.map(d => {
            const distSales = sales.filter(s => s.distributorId.toString() === d._id.toString());
            const distRestocking = restockingOrders.filter(o => o.distributorId.toString() === d._id.toString());

            return {
                id: d._id,
                name: d.name,
                totalSales: distSales.reduce((acc, curr) => acc + curr.totalAmount, 0),
                totalRestocking: distRestocking.reduce((acc, curr) => acc + curr.totalAmount, 0),
                salesCount: distSales.length,
                restockCount: distRestocking.length
            };
        }).sort((a, b) => b.totalSales - a.totalSales);

        // 4. Recent Activity
        const recentRestocks = await Order.find({ companyId, status: 'Delivered' })
            .populate('distributorId', 'name')
            .sort({ updatedAt: -1 })
            .limit(5);

        const recentSales = await DistributorSale.find({ distributorId: { $in: distributorIds } })
            .populate('distributorId', 'name')
            .sort({ date: -1 })
            .limit(5);

        // 5. Manual Restocking Activities (Audit Logs)
        const ProductStockLog = require('../models/ProductStockLog');
        const manualLogs = await ProductStockLog.find({
            companyId,
            change: { $gt: 0 } // Only show additions
        })
            .populate('userId', 'name')
            .populate('productId', 'name sku')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            summary: {
                totalRestocking,
                totalDistSales,
                activeDistributors: distributors.length,
                salesCount: sales.length,
                manualAdjustments: manualLogs.length
            },
            distributorPerformance,
            recentActivity: {
                restocks: recentRestocks,
                sales: recentSales,
                manualRestocks: manualLogs
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
